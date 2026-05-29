import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const feedbackSubmission = pgTable(
  "feedback_submission",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("feedback_submission_createdAt_idx").on(table.createdAt),
    index("feedback_submission_email_idx").on(table.email),
  ],
);

export const profileGender = pgEnum("profile_gender", [
  "male",
  "female",
  "no",
]);

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dob: date("dob"),
  gender: profileGender("gender"),
  bio: text("bio"),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const follow = pgTable(
  "follow",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("follow_followerId_idx").on(table.followerId),
    index("follow_followingId_idx").on(table.followingId),
    uniqueIndex("follow_unique_idx").on(table.followerId, table.followingId),
  ],
);

export const echoInteractionType = pgEnum("echo_interaction_type", [
  "like",
  "save",
  "share",
]);

export const echo = pgTable(
  "echo",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    shareCount: integer("share_count").default(0).notNull(),
    saveCount: integer("save_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("echo_authorId_idx").on(table.authorId),
    index("echo_createdAt_idx").on(table.createdAt),
  ],
);

export const echoComment = pgTable(
  "echo_comment",
  {
    id: text("id").primaryKey(),
    echoId: text("echo_id")
      .notNull()
      .references(() => echo.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    content: text("content").notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("echo_comment_echoId_idx").on(table.echoId),
    index("echo_comment_authorId_idx").on(table.authorId),
    index("echo_comment_parentId_idx").on(table.parentId),
    index("echo_comment_createdAt_idx").on(table.createdAt),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  ],
);

export const commentLike = pgTable(
  "comment_like",
  {
    id: text("id").primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => echoComment.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("comment_like_commentId_idx").on(table.commentId),
    index("comment_like_userId_idx").on(table.userId),
    uniqueIndex("comment_like_unique_idx").on(table.commentId, table.userId),
  ],
);

export const echoInteraction = pgTable(
  "echo_interaction",
  {
    id: text("id").primaryKey(),
    echoId: text("echo_id")
      .notNull()
      .references(() => echo.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: echoInteractionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("echo_interaction_echoId_idx").on(table.echoId),
    index("echo_interaction_userId_idx").on(table.userId),
    uniqueIndex("echo_interaction_unique_idx").on(
      table.echoId,
      table.userId,
      table.type,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  echoes: many(echo),
  echoComments: many(echoComment),
  commentLikes: many(commentLike),
  echoInteractions: many(echoInteraction),
  followers: many(follow, { relationName: "following" }),
  following: many(follow, { relationName: "follower" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const echoRelations = relations(echo, ({ one, many }) => ({
  author: one(user, {
    fields: [echo.authorId],
    references: [user.id],
  }),
  comments: many(echoComment),
  interactions: many(echoInteraction),
}));

export const echoCommentRelations = relations(echoComment, ({ one, many }) => ({
  echo: one(echo, {
    fields: [echoComment.echoId],
    references: [echo.id],
  }),
  author: one(user, {
    fields: [echoComment.authorId],
    references: [user.id],
  }),
  parent: one(echoComment, {
    fields: [echoComment.parentId],
    references: [echoComment.id],
    relationName: "comment_parent",
  }),
  replies: many(echoComment, {
    relationName: "comment_parent",
  }),
  likes: many(commentLike),
}));

export const commentLikeRelations = relations(commentLike, ({ one }) => ({
  comment: one(echoComment, {
    fields: [commentLike.commentId],
    references: [echoComment.id],
  }),
  user: one(user, {
    fields: [commentLike.userId],
    references: [user.id],
  }),
}));

export const echoInteractionRelations = relations(echoInteraction, ({ one }) => ({
  echo: one(echo, {
    fields: [echoInteraction.echoId],
    references: [echo.id],
  }),
  user: one(user, {
    fields: [echoInteraction.userId],
    references: [user.id],
  }),
}));

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));
