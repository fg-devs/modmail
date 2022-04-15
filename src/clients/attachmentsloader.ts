import { credentials, loadPackageDefinition } from "@grpc/grpc-js";
import { CONFIG } from "../globals";
import { AttachmentsClient } from "../../codegen/attachments/attachments_grpc_pb.js";

export default class AttachmentClientLoader {
    public static getAttachmentClient() {
        return new AttachmentsClient(CONFIG.clients.attachmentsUri, credentials.createInsecure());
    }
}