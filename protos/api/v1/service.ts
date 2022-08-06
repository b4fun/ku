// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "api/v1/service.proto" (package "api.v1", syntax proto3)
// tslint:disable
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Session } from "./model";
/**
 * @generated from protobuf message api.v1.ListSessionsRequest
 */
export interface ListSessionsRequest {
}
/**
 * @generated from protobuf message api.v1.ListSessionsResponse
 */
export interface ListSessionsResponse {
    /**
     * @generated from protobuf field: repeated api.v1.Session sessions = 1;
     */
    sessions: Session[];
}
// @generated message type with reflection information, may provide speed optimized methods
class ListSessionsRequest$Type extends MessageType<ListSessionsRequest> {
    constructor() {
        super("api.v1.ListSessionsRequest", []);
    }
    create(value?: PartialMessage<ListSessionsRequest>): ListSessionsRequest {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ListSessionsRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListSessionsRequest): ListSessionsRequest {
        return target ?? this.create();
    }
    internalBinaryWrite(message: ListSessionsRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.ListSessionsRequest
 */
export const ListSessionsRequest = new ListSessionsRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListSessionsResponse$Type extends MessageType<ListSessionsResponse> {
    constructor() {
        super("api.v1.ListSessionsResponse", [
            { no: 1, name: "sessions", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Session }
        ]);
    }
    create(value?: PartialMessage<ListSessionsResponse>): ListSessionsResponse {
        const message = { sessions: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ListSessionsResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListSessionsResponse): ListSessionsResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated api.v1.Session sessions */ 1:
                    message.sessions.push(Session.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ListSessionsResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated api.v1.Session sessions = 1; */
        for (let i = 0; i < message.sessions.length; i++)
            Session.internalBinaryWrite(message.sessions[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.ListSessionsResponse
 */
export const ListSessionsResponse = new ListSessionsResponse$Type();
/**
 * @generated ServiceType for protobuf service api.v1.APIService
 */
export const APIService = new ServiceType("api.v1.APIService", [
    { name: "ListSessions", options: {}, I: ListSessionsRequest, O: ListSessionsResponse }
]);
