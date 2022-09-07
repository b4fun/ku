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
import { TableColumn } from "./model";
import { TableRow } from "./model";
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
/**
 * @generated from protobuf message api.v1.QueryTableRequest
 */
export interface QueryTableRequest {
    /**
     * sql specifies the sql query to run
     *
     * @generated from protobuf field: string sql = 1;
     */
    sql: string;
}
/**
 * @generated from protobuf message api.v1.QueryTableResponse
 */
export interface QueryTableResponse {
    /**
     * @generated from protobuf field: repeated api.v1.TableRow rows = 1;
     */
    rows: TableRow[];
    /**
     * @generated from protobuf field: repeated api.v1.TableColumn columns = 2;
     */
    columns: TableColumn[];
}
/**
 * @generated from protobuf message api.v1.UpdateSessionRequest
 */
export interface UpdateSessionRequest {
    /**
     * @generated from protobuf field: api.v1.Session session = 1;
     */
    session?: Session;
}
/**
 * @generated from protobuf message api.v1.UpdateSessionResponse
 */
export interface UpdateSessionResponse {
    /**
     * @generated from protobuf field: api.v1.Session session = 1;
     */
    session?: Session;
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
// @generated message type with reflection information, may provide speed optimized methods
class QueryTableRequest$Type extends MessageType<QueryTableRequest> {
    constructor() {
        super("api.v1.QueryTableRequest", [
            { no: 1, name: "sql", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<QueryTableRequest>): QueryTableRequest {
        const message = { sql: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<QueryTableRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: QueryTableRequest): QueryTableRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string sql */ 1:
                    message.sql = reader.string();
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
    internalBinaryWrite(message: QueryTableRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string sql = 1; */
        if (message.sql !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.sql);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.QueryTableRequest
 */
export const QueryTableRequest = new QueryTableRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class QueryTableResponse$Type extends MessageType<QueryTableResponse> {
    constructor() {
        super("api.v1.QueryTableResponse", [
            { no: 1, name: "rows", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => TableRow },
            { no: 2, name: "columns", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => TableColumn }
        ]);
    }
    create(value?: PartialMessage<QueryTableResponse>): QueryTableResponse {
        const message = { rows: [], columns: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<QueryTableResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: QueryTableResponse): QueryTableResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated api.v1.TableRow rows */ 1:
                    message.rows.push(TableRow.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* repeated api.v1.TableColumn columns */ 2:
                    message.columns.push(TableColumn.internalBinaryRead(reader, reader.uint32(), options));
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
    internalBinaryWrite(message: QueryTableResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated api.v1.TableRow rows = 1; */
        for (let i = 0; i < message.rows.length; i++)
            TableRow.internalBinaryWrite(message.rows[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* repeated api.v1.TableColumn columns = 2; */
        for (let i = 0; i < message.columns.length; i++)
            TableColumn.internalBinaryWrite(message.columns[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.QueryTableResponse
 */
export const QueryTableResponse = new QueryTableResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateSessionRequest$Type extends MessageType<UpdateSessionRequest> {
    constructor() {
        super("api.v1.UpdateSessionRequest", [
            { no: 1, name: "session", kind: "message", T: () => Session }
        ]);
    }
    create(value?: PartialMessage<UpdateSessionRequest>): UpdateSessionRequest {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<UpdateSessionRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: UpdateSessionRequest): UpdateSessionRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* api.v1.Session session */ 1:
                    message.session = Session.internalBinaryRead(reader, reader.uint32(), options, message.session);
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
    internalBinaryWrite(message: UpdateSessionRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* api.v1.Session session = 1; */
        if (message.session)
            Session.internalBinaryWrite(message.session, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.UpdateSessionRequest
 */
export const UpdateSessionRequest = new UpdateSessionRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateSessionResponse$Type extends MessageType<UpdateSessionResponse> {
    constructor() {
        super("api.v1.UpdateSessionResponse", [
            { no: 1, name: "session", kind: "message", T: () => Session }
        ]);
    }
    create(value?: PartialMessage<UpdateSessionResponse>): UpdateSessionResponse {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<UpdateSessionResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: UpdateSessionResponse): UpdateSessionResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* api.v1.Session session */ 1:
                    message.session = Session.internalBinaryRead(reader, reader.uint32(), options, message.session);
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
    internalBinaryWrite(message: UpdateSessionResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* api.v1.Session session = 1; */
        if (message.session)
            Session.internalBinaryWrite(message.session, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.UpdateSessionResponse
 */
export const UpdateSessionResponse = new UpdateSessionResponse$Type();
/**
 * @generated ServiceType for protobuf service api.v1.APIService
 */
export const APIService = new ServiceType("api.v1.APIService", [
    { name: "ListSessions", options: {}, I: ListSessionsRequest, O: ListSessionsResponse },
    { name: "UpdateSession", options: {}, I: UpdateSessionRequest, O: UpdateSessionResponse },
    { name: "QueryTable", options: {}, I: QueryTableRequest, O: QueryTableResponse }
]);
