import sequelize from '../config/database';
import User from './User';
import Item from './Item';
import ItemImage from './ItemImage';
import Tag from './Tag';
import ItemTag from './ItemTag';
import Message from './Message';
import ForumPost from './ForumPost';
import Event from './Event';

// User associations
User.hasMany(Item, {
  foreignKey: 'vendor_id',
  as: 'items',
  onDelete: 'RESTRICT'
});

User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sentMessages'
});

User.hasMany(Message, {
  foreignKey: 'recipient_id',
  as: 'receivedMessages'
});

User.hasMany(ForumPost, {
  foreignKey: 'user_id',
  as: 'forumPosts'
});

User.hasMany(Event, {
  foreignKey: 'created_by_user_id',
  as: 'createdEvents'
});

// Item associations
Item.belongsTo(User, {
  foreignKey: 'vendor_id',
  as: 'vendor',
  onDelete: 'RESTRICT'
});

Item.hasMany(ItemImage, {
  foreignKey: 'item_id',
  as: 'images'
});

Item.hasMany(Message, {
  foreignKey: 'item_id',
  as: 'messages'
});

Item.hasMany(ForumPost, {
  foreignKey: 'item_id',
  as: 'forumPosts'
});

Item.belongsToMany(Tag, {
  through: ItemTag,
  foreignKey: 'item_id',
  otherKey: 'tag_id',
  as: 'tags'
});

// ItemImage associations
ItemImage.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

// Tag associations
Tag.belongsToMany(Item, {
  through: ItemTag,
  foreignKey: 'tag_id',
  otherKey: 'item_id',
  as: 'items'
});

// ItemTag associations
ItemTag.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

ItemTag.belongsTo(Tag, {
  foreignKey: 'tag_id',
  as: 'tag'
});

ItemTag.belongsTo(User, {
  foreignKey: 'added_by_user_id',
  as: 'addedBy'
});

// Message associations
Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
});

Message.belongsTo(User, {
  foreignKey: 'recipient_id',
  as: 'recipient'
});

Message.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

// ForumPost associations
ForumPost.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

ForumPost.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

ForumPost.belongsTo(ForumPost, {
  foreignKey: 'parent_post_id',
  as: 'parentPost'
});

ForumPost.hasMany(ForumPost, {
  foreignKey: 'parent_post_id',
  as: 'replies'
});

// Event associations
Event.belongsTo(User, {
  foreignKey: 'created_by_user_id',
  as: 'createdBy'
});

export {
  sequelize,
  User,
  Item,
  ItemImage,
  Tag,
  ItemTag,
  Message,
  ForumPost,
  Event
};