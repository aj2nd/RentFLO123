type RecordLike = Record<string, any>;
export type ResponseViewerRole = "TENANT" | "OWNER" | "ADMIN" | null | undefined;

export function propertyResponse(property: RecordLike, viewerRole: ResponseViewerRole) {
  const result: RecordLike = {
    id: property.id,
    address: property.address,
    monthlyRent: property.monthlyRent,
    payoutDay: property.payoutDay,
    createdAt: property.createdAt,
  };
  if (viewerRole === "OWNER" || viewerRole === "ADMIN") result.tenantId = property.tenantId;
  if (viewerRole === "ADMIN") result.ownerId = property.ownerId;
  return result;
}

export function ledgerResponse(ledger: RecordLike, viewerRole: ResponseViewerRole) {
  return {
    id: ledger.id,
    propertyId: ledger.propertyId,
    amountAdvanced: ledger.amountAdvanced,
    amountCollected: ledger.amountCollected,
    status: ledger.status,
    monthYear: ledger.monthYear,
    createdAt: ledger.createdAt,
    updatedAt: ledger.updatedAt,
    ...(ledger.property ? { property: propertyResponse(ledger.property, viewerRole) } : {}),
  };
}

export function paymentResponse(payment: RecordLike, viewerRole: ResponseViewerRole) {
  const result: RecordLike = {
    id: payment.id,
    ledgerId: payment.ledgerId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    rejectionReason: payment.rejectionReason ?? null,
    createdAt: payment.createdAt,
  };
  if (viewerRole === "ADMIN") {
    result.razorpayOrderId = payment.razorpayOrderId ?? null;
    result.transactionRef = payment.transactionRef ?? null;
    result.proofScreenshotUrl = payment.proofScreenshotUrl ?? null;
    result.verifiedAt = payment.verifiedAt ?? null;
  }
  return result;
}

export function pendingPaymentResponse(payment: RecordLike) {
  return {
    ...paymentResponse(payment, "ADMIN"),
    ledger: payment.ledger ? {
      id: payment.ledger.id,
      monthYear: payment.ledger.monthYear,
      property: payment.ledger.property ? { address: payment.ledger.property.address } : undefined,
    } : undefined,
  };
}

export function ticketResponse(ticket: RecordLike) {
  return {
    id: ticket.id,
    propertyId: ticket.propertyId,
    title: ticket.title,
    description: ticket.description,
    photoUrl: ticket.photoUrl ?? null,
    status: ticket.status,
    resolvedAt: ticket.resolvedAt ?? null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    property: ticket.property ? { id: ticket.property.id, address: ticket.property.address } : undefined,
  };
}

export function agreementResponse(agreement: RecordLike) {
  if (!agreement) return null;
  return {
    id: agreement.id,
    propertyId: agreement.propertyId,
    status: agreement.status,
    ownerSignedAt: agreement.ownerSignedAt ?? null,
    tenantSignedAt: agreement.tenantSignedAt ?? null,
    createdAt: agreement.createdAt,
  };
}

export function notificationResponse(notification: RecordLike) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    read: notification.read,
    url: notification.url ?? null,
    createdAt: notification.createdAt,
  };
}

export function propertyMessageResponse(message: RecordLike) {
  return {
    id: message.id,
    propertyId: message.propertyId,
    senderId: message.senderId,
    body: message.body,
    read: message.read,
    createdAt: message.createdAt,
  };
}

export function legacyConversationResponse(conversation: RecordLike) {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
  };
}

export function legacyChatMessageResponse(message: RecordLike) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}
