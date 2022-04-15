// package: attachments
// file: proto/attachments.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class NewAttachmentRequest extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): NewAttachmentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NewAttachmentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: NewAttachmentRequest): NewAttachmentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NewAttachmentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NewAttachmentRequest;
    static deserializeBinaryFromReader(message: NewAttachmentRequest, reader: jspb.BinaryReader): NewAttachmentRequest;
}

export namespace NewAttachmentRequest {
    export type AsObject = {
        url: string,
    }
}

export class Attachment extends jspb.Message { 
    getUuid(): string;
    setUuid(value: string): Attachment;
    getUrl(): string;
    setUrl(value: string): Attachment;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Attachment.AsObject;
    static toObject(includeInstance: boolean, msg: Attachment): Attachment.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Attachment, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Attachment;
    static deserializeBinaryFromReader(message: Attachment, reader: jspb.BinaryReader): Attachment;
}

export namespace Attachment {
    export type AsObject = {
        uuid: string,
        url: string,
    }
}
