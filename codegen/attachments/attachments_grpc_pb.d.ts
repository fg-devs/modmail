// package: attachments
// file: proto/attachments.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as proto_attachments_pb from "./attachments_pb";

interface IAttachmentsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createAttachment: IAttachmentsService_ICreateAttachment;
}

interface IAttachmentsService_ICreateAttachment extends grpc.MethodDefinition<proto_attachments_pb.NewAttachmentRequest, proto_attachments_pb.Attachment> {
    path: "/attachments.Attachments/CreateAttachment";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<proto_attachments_pb.NewAttachmentRequest>;
    requestDeserialize: grpc.deserialize<proto_attachments_pb.NewAttachmentRequest>;
    responseSerialize: grpc.serialize<proto_attachments_pb.Attachment>;
    responseDeserialize: grpc.deserialize<proto_attachments_pb.Attachment>;
}

export const AttachmentsService: IAttachmentsService;

export interface IAttachmentsServer {
    createAttachment: grpc.handleUnaryCall<proto_attachments_pb.NewAttachmentRequest, proto_attachments_pb.Attachment>;
}

export interface IAttachmentsClient {
    createAttachment(request: proto_attachments_pb.NewAttachmentRequest, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
    createAttachment(request: proto_attachments_pb.NewAttachmentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
    createAttachment(request: proto_attachments_pb.NewAttachmentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
}

export class AttachmentsClient extends grpc.Client implements IAttachmentsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public createAttachment(request: proto_attachments_pb.NewAttachmentRequest, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
    public createAttachment(request: proto_attachments_pb.NewAttachmentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
    public createAttachment(request: proto_attachments_pb.NewAttachmentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: proto_attachments_pb.Attachment) => void): grpc.ClientUnaryCall;
}
