// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var attachments_pb = require('./attachments_pb.js');

function serialize_attachments_Attachment(arg) {
  if (!(arg instanceof attachments_pb.Attachment)) {
    throw new Error('Expected argument of type attachments.Attachment');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_attachments_Attachment(buffer_arg) {
  return attachments_pb.Attachment.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_attachments_NewAttachmentRequest(arg) {
  if (!(arg instanceof attachments_pb.NewAttachmentRequest)) {
    throw new Error('Expected argument of type attachments.NewAttachmentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_attachments_NewAttachmentRequest(buffer_arg) {
  return attachments_pb.NewAttachmentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var AttachmentsService = exports.AttachmentsService = {
  createAttachment: {
    path: '/attachments.Attachments/CreateAttachment',
    requestStream: false,
    responseStream: false,
    requestType: attachments_pb.NewAttachmentRequest,
    responseType: attachments_pb.Attachment,
    requestSerialize: serialize_attachments_NewAttachmentRequest,
    requestDeserialize: deserialize_attachments_NewAttachmentRequest,
    responseSerialize: serialize_attachments_Attachment,
    responseDeserialize: deserialize_attachments_Attachment,
  },
};

exports.AttachmentsClient = grpc.makeGenericClientConstructor(AttachmentsService);
