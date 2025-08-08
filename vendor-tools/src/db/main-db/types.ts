import type { ColumnType, GeneratedAlways } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { UserType, ItemStatus } from "./enums";

export type Event = {
    event_id: GeneratedAlways<number>;
    title: string;
    description: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    created_by_user_id: number;
    is_active: Generated<number>;
    created_at: Generated<string>;
};
export type ForumPost = {
    post_id: GeneratedAlways<number>;
    item_id: number | null;
    user_id: number;
    parent_post_id: number | null;
    title: string | null;
    content: string;
    is_pinned: Generated<number>;
    created_at: Generated<string>;
    updated_at: string;
};
export type Item = {
    item_id: GeneratedAlways<number>;
    title: string;
    description: string | null;
    price: number | null;
    vendor_id: number;
    location: string | null;
    contact_info: string | null;
    status: Generated<ItemStatus>;
    date_added: Generated<string>;
    updated_at: string;
    url_slug: string | null;
    view_count: Generated<number>;
};
export type ItemImage = {
    image_id: GeneratedAlways<number>;
    item_id: number;
    image_url: string;
    image_order: Generated<number>;
    alt_text: string | null;
    uploaded_at: Generated<string>;
};
export type ItemTag = {
    item_id: number;
    tag_id: number;
    added_by_user_id: number | null;
    added_at: Generated<string>;
};
export type Message = {
    message_id: GeneratedAlways<number>;
    item_id: number | null;
    sender_id: number;
    recipient_id: number;
    subject: string | null;
    message_text: string;
    is_read: Generated<number>;
    sent_at: Generated<string>;
};
export type Tag = {
    tag_id: GeneratedAlways<number>;
    tag_name: string;
    created_at: Generated<string>;
};
export type User = {
    user_id: GeneratedAlways<number>;
    name: string;
    email: string;
    password_hash: string;
    contact_info: string | null;
    phone_number: string | null;
    yf_vendor_id: string | null;
    user_type: UserType;
    is_active: Generated<number>;
    created_at: Generated<string>;
    updated_at: string;
};
export type DB = {
    events: Event;
    forum_posts: ForumPost;
    item_images: ItemImage;
    item_tags: ItemTag;
    items: Item;
    messages: Message;
    tags: Tag;
    users: User;
};
