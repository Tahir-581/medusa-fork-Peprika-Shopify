export const ShopifyLikeTopics = {
  orderCreated: "order.created",
  orderUpdated: "order.updated",
  orderCancelled: "order.cancelled",
  orderFulfilled: "order.fulfilled",
  orderPaid: "order.paid",
  refundCreated: "refund.created",
  returnRequested: "return.requested",
  returnReceived: "return.received",

  productCreated: "product.created",
  productUpdated: "product.updated",
  productDeleted: "product.deleted",

  productVariantCreated: "product-variant.created",
  productVariantUpdated: "product-variant.updated",
  productVariantDeleted: "product-variant.deleted",

  inventoryItemCreated: "inventory-item.created",
  inventoryItemUpdated: "inventory-item.updated",
  inventoryLevelUpdated: "inventory-level.updated",

  customerCreated: "customer.created",
  customerUpdated: "customer.updated",

  cartCreated: "cart.created",
  cartUpdated: "cart.updated",
  cartCompleted: "cart.completed",
} as const

export type ShopifyLikeTopic = (typeof ShopifyLikeTopics)[keyof typeof ShopifyLikeTopics]

