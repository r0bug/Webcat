import { Request, Response, NextFunction } from 'express';
import { ForumPost, User } from '../models';
import { Op } from 'sequelize';
import { AuthRequest } from '../types/auth';
import sequelize from '../config/database';

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, content, parentPostId } = req.body;
    const userId = req.user!.userId;

    // If parentPostId is provided, verify the parent post exists
    if (parentPostId) {
      const parentPost = await ForumPost.findByPk(parentPostId);
      if (!parentPost) {
        await transaction.rollback();
        res.status(404).json({ message: 'Parent post not found' });
        return;
      }
    }

    const post = await ForumPost.create({
      title: parentPostId ? null : title, // Only root posts have titles
      content,
      userId,
      parentPostId
    }, { transaction });

    await transaction.commit();

    const createdPost = await ForumPost.findByPk(post.postId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'name', 'email', 'userType']
      }]
    });

    res.status(201).json(createdPost);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      userId,
      parentPostId = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { parentPostId };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const { count, rows } = await ForumPost.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email', 'userType']
        },
        {
          model: ForumPost,
          as: 'replies',
          separate: true,
          limit: 3,
          order: [['createdAt', 'DESC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'name', 'email', 'userType']
          }]
        }
      ],
      order: [[sortBy as string, sortOrder as string]],
      limit: limitNum,
      offset
    });

    // Get reply counts
    const postIds = rows.map(post => post.postId);
    const replyCounts = await ForumPost.findAll({
      attributes: [
        'parentPostId',
        [sequelize.fn('COUNT', sequelize.col('post_id')), 'replyCount']
      ],
      where: { parentPostId: postIds },
      group: ['parentPostId'],
      raw: true
    }) as any[];

    const replyCountMap = replyCounts.reduce((acc: any, item: any) => {
      acc[item.parentPostId] = parseInt(item.replyCount);
      return acc;
    }, {});

    const postsWithCounts = rows.map(post => ({
      ...post.toJSON(),
      replyCount: replyCountMap[post.postId] || 0
    }));

    res.json({
      data: postsWithCounts,
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await ForumPost.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email', 'userType']
        },
        {
          model: ForumPost,
          as: 'parent',
          include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'name', 'email', 'userType']
          }]
        }
      ]
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Increment view count
    await post.increment('viewCount');

    // Get all replies
    const replies = await ForumPost.findAll({
      where: { parentPostId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      ...post.toJSON(),
      viewCount: post.viewCount + 1,
      replies
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const post = await ForumPost.findByPk(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check permissions: owner, staff, or admin can edit
    if (post.userId !== userId && userRole === 'Vendor') {
      res.status(403).json({ message: 'You do not have permission to edit this post' });
      return;
    }

    post.content = content;
    post.isEdited = true;
    await post.save();

    const updatedPost = await ForumPost.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'name', 'email', 'userType']
      }]
    });

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const post = await ForumPost.findByPk(id, { transaction });

    if (!post) {
      await transaction.rollback();
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check permissions: owner or admin can delete
    if (post.userId !== userId && userRole !== 'Admin') {
      await transaction.rollback();
      res.status(403).json({ message: 'You do not have permission to delete this post' });
      return;
    }

    // Check if post has replies
    const replyCount = await ForumPost.count({
      where: { parentPostId: id },
      transaction
    });

    if (replyCount > 0 && !req.query.force) {
      await transaction.rollback();
      res.status(400).json({ 
        message: 'Post has replies. Add ?force=true to delete post and all replies',
        replyCount 
      });
      return;
    }

    // Delete post (and replies if forced)
    if (req.query.force) {
      await ForumPost.destroy({
        where: { parentPostId: id },
        transaction
      });
    }

    await post.destroy({ transaction });
    await transaction.commit();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getPopularPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 7, limit = 10 } = req.query;
    const daysNum = parseInt(days as string);
    const limitNum = parseInt(limit as string);

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysNum);

    const posts = await ForumPost.findAll({
      where: {
        parentPostId: null, // Only root posts
        createdAt: { [Op.gte]: dateThreshold }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['viewCount', 'DESC']],
      limit: limitNum
    });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const searchPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await ForumPost.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { content: { [Op.like]: `%${q}%` } }
        ]
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'name', 'email', 'userType']
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      data: rows,
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
      query: q
    });
  } catch (error) {
    next(error);
  }
};