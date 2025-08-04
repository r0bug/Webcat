import { Op, WhereOptions, Order } from 'sequelize';
import { Item, User, ItemImage, Tag } from '../models';
import { ItemFilters, PaginationQuery } from '../types';
import { PAGINATION } from '../config/constants';

interface GetItemsOptions extends PaginationQuery, ItemFilters {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getItems = async (options: GetItemsOptions) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    status,
    vendorId,
    minPrice,
    maxPrice,
    tags,
    search,
    sortBy = 'dateAdded',
    sortOrder = 'desc'
  } = options;

  // Build where clause
  const where: WhereOptions<Item> = {};

  if (status) {
    where.status = status;
  }

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price[Op.gte] = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price[Op.lte] = maxPrice;
    }
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  // Build tag filter
  const tagWhere = tags && tags.length > 0 ? {
    tagName: { [Op.in]: Array.isArray(tags) ? tags : [tags] }
  } : undefined;

  // Build order clause
  const orderMap: Record<string, string> = {
    dateAdded: 'date_added',
    price: 'price',
    title: 'title',
    viewCount: 'view_count'
  };

  const order: Order = [[orderMap[sortBy] || 'date_added', sortOrder.toUpperCase()]];

  // Calculate offset
  const offset = (page - 1) * limit;

  // Execute query
  const { count, rows } = await Item.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'vendor',
        attributes: ['userId', 'name', 'email', 'contactInfo', 'phoneNumber', 'yfVendorId']
      },
      {
        model: ItemImage,
        as: 'images',
        attributes: ['imageId', 'imageUrl', 'imageOrder', 'altText'],
        separate: true,
        order: [['image_order', 'ASC']]
      },
      {
        model: Tag,
        as: 'tags',
        where: tagWhere,
        through: { attributes: [] },
        required: tags && tags.length > 0
      }
    ],
    order,
    limit,
    offset,
    distinct: true
  });

  return {
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

export const getItemById = async (itemId: number) => {
  const item = await Item.findByPk(itemId, {
    include: [
      {
        model: User,
        as: 'vendor',
        attributes: ['userId', 'name', 'email', 'contactInfo', 'phoneNumber', 'yfVendorId']
      },
      {
        model: ItemImage,
        as: 'images',
        attributes: ['imageId', 'imageUrl', 'imageOrder', 'altText'],
        order: [['image_order', 'ASC']]
      },
      {
        model: Tag,
        as: 'tags',
        through: { attributes: [] }
      }
    ]
  });

  return item;
};

export const getItemBySlug = async (slug: string) => {
  const item = await Item.findOne({
    where: { urlSlug: slug },
    include: [
      {
        model: User,
        as: 'vendor',
        attributes: ['userId', 'name', 'email', 'contactInfo', 'phoneNumber', 'yfVendorId']
      },
      {
        model: ItemImage,
        as: 'images',
        attributes: ['imageId', 'imageUrl', 'imageOrder', 'altText'],
        order: [['image_order', 'ASC']]
      },
      {
        model: Tag,
        as: 'tags',
        through: { attributes: [] }
      }
    ]
  });

  return item;
};

export const incrementViewCount = async (itemId: number) => {
  await Item.increment('viewCount', {
    where: { itemId }
  });
};

export const checkItemOwnership = (item: Item, userId: number): boolean => {
  return item.vendorId === userId;
};