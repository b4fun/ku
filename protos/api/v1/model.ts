// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "api/v1/model.proto" (package "api.v1", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Duration } from "../../google/protobuf/duration";
import { StringValue } from "../../google/protobuf/wrappers";
import { DoubleValue } from "../../google/protobuf/wrappers";
import { Int64Value } from "../../google/protobuf/wrappers";
import { Timestamp } from "../../google/protobuf/timestamp";
import { BoolValue } from "../../google/protobuf/wrappers";
// sessions -(many)-> tables

/**
 * @generated from protobuf message api.v1.Session
 */
export interface Session {
    /**
     * id - id of the session (immutable).
     *
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * tables - tables in the session.
     *
     * @generated from protobuf field: repeated api.v1.TableSchema tables = 2;
     */
    tables: TableSchema[];
    /**
     * name - display name of the session.
     *
     * @generated from protobuf field: string name = 3;
     */
    name: string;
}
/**
 * @generated from protobuf message api.v1.TableKeyValue
 */
export interface TableKeyValue {
    /**
     * key - key of the table column.
     *
     * @generated from protobuf field: string key = 1;
     */
    key: string;
    // value_* - value of the table column.
    // We don't use oneof here to avoid tedious Go struct output

    /**
     * @generated from protobuf field: google.protobuf.BoolValue value_bool = 3;
     */
    valueBool?: BoolValue;
    /**
     * @generated from protobuf field: google.protobuf.Timestamp value_date_time = 4;
     */
    valueDateTime?: Timestamp;
    /**
     * @generated from protobuf field: google.protobuf.Int64Value value_int64 = 5;
     */
    valueInt64?: Int64Value;
    /**
     * @generated from protobuf field: google.protobuf.DoubleValue value_real = 6;
     */
    valueReal?: DoubleValue;
    /**
     * @generated from protobuf field: google.protobuf.StringValue value_string = 7;
     */
    valueString?: StringValue;
    /**
     * @generated from protobuf field: google.protobuf.Duration value_duration = 8;
     */
    valueDuration?: Duration;
}
/**
 * @generated from protobuf message api.v1.TableRow
 */
export interface TableRow {
    /**
     * @generated from protobuf field: repeated api.v1.TableKeyValue columns = 1;
     */
    columns: TableKeyValue[];
}
/**
 * @generated from protobuf message api.v1.TableColumn
 */
export interface TableColumn {
    /**
     * key - key of the table column.
     *
     * @generated from protobuf field: string key = 1;
     */
    key: string;
    /**
     * type - type of the table column.
     *
     * @generated from protobuf field: api.v1.TableColumn.Type type = 2;
     */
    type: TableColumn_Type;
}
/**
 * @generated from protobuf enum api.v1.TableColumn.Type
 */
export enum TableColumn_Type {
    /**
     * @generated from protobuf enum value: TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from protobuf enum value: TYPE_BOOL = 1;
     */
    BOOL = 1,
    /**
     * @generated from protobuf enum value: TYPE_DATE_TIME = 2;
     */
    DATE_TIME = 2,
    /**
     * @generated from protobuf enum value: TYPE_INT64 = 3;
     */
    INT64 = 3,
    /**
     * @generated from protobuf enum value: TYPE_REAL = 4;
     */
    REAL = 4,
    /**
     * @generated from protobuf enum value: TYPE_STRING = 5;
     */
    STRING = 5,
    /**
     * @generated from protobuf enum value: TYPE_TIMESPAN = 6;
     */
    TIMESPAN = 6
}
/**
 * @generated from protobuf message api.v1.TableSchema
 */
export interface TableSchema {
    /**
     * id - id of the table (immutable).
     *
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * type - type of the table.
     *
     * @generated from protobuf field: api.v1.TableSchema.Type type = 2;
     */
    type: TableSchema_Type;
    /**
     * columns - columns of the table.
     *
     * @generated from protobuf field: repeated api.v1.TableColumn columns = 3;
     */
    columns: TableColumn[];
    /**
     * session_id - the session id of the table.
     *
     * @generated from protobuf field: string session_id = 4;
     */
    sessionId: string;
    /**
     * name - display name of the table.
     *
     * @generated from protobuf field: string name = 5;
     */
    name: string;
}
/**
 * @generated from protobuf enum api.v1.TableSchema.Type
 */
export enum TableSchema_Type {
    /**
     * @generated from protobuf enum value: TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from protobuf enum value: TYPE_RAW = 1;
     */
    RAW = 1,
    /**
     * @generated from protobuf enum value: TYPE_PARSED = 2;
     */
    PARSED = 2
}
// @generated message type with reflection information, may provide speed optimized methods
class Session$Type extends MessageType<Session> {
    constructor() {
        super("api.v1.Session", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "tables", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => TableSchema },
            { no: 3, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<Session>): Session {
        const message = { id: "", tables: [], name: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<Session>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Session): Session {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* repeated api.v1.TableSchema tables */ 2:
                    message.tables.push(TableSchema.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* string name */ 3:
                    message.name = reader.string();
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
    internalBinaryWrite(message: Session, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* repeated api.v1.TableSchema tables = 2; */
        for (let i = 0; i < message.tables.length; i++)
            TableSchema.internalBinaryWrite(message.tables[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* string name = 3; */
        if (message.name !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.Session
 */
export const Session = new Session$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TableKeyValue$Type extends MessageType<TableKeyValue> {
    constructor() {
        super("api.v1.TableKeyValue", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "value_bool", kind: "message", T: () => BoolValue },
            { no: 4, name: "value_date_time", kind: "message", T: () => Timestamp },
            { no: 5, name: "value_int64", kind: "message", T: () => Int64Value },
            { no: 6, name: "value_real", kind: "message", T: () => DoubleValue },
            { no: 7, name: "value_string", kind: "message", T: () => StringValue },
            { no: 8, name: "value_duration", kind: "message", T: () => Duration }
        ]);
    }
    create(value?: PartialMessage<TableKeyValue>): TableKeyValue {
        const message = { key: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<TableKeyValue>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TableKeyValue): TableKeyValue {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                case /* google.protobuf.BoolValue value_bool */ 3:
                    message.valueBool = BoolValue.internalBinaryRead(reader, reader.uint32(), options, message.valueBool);
                    break;
                case /* google.protobuf.Timestamp value_date_time */ 4:
                    message.valueDateTime = Timestamp.internalBinaryRead(reader, reader.uint32(), options, message.valueDateTime);
                    break;
                case /* google.protobuf.Int64Value value_int64 */ 5:
                    message.valueInt64 = Int64Value.internalBinaryRead(reader, reader.uint32(), options, message.valueInt64);
                    break;
                case /* google.protobuf.DoubleValue value_real */ 6:
                    message.valueReal = DoubleValue.internalBinaryRead(reader, reader.uint32(), options, message.valueReal);
                    break;
                case /* google.protobuf.StringValue value_string */ 7:
                    message.valueString = StringValue.internalBinaryRead(reader, reader.uint32(), options, message.valueString);
                    break;
                case /* google.protobuf.Duration value_duration */ 8:
                    message.valueDuration = Duration.internalBinaryRead(reader, reader.uint32(), options, message.valueDuration);
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
    internalBinaryWrite(message: TableKeyValue, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        /* google.protobuf.BoolValue value_bool = 3; */
        if (message.valueBool)
            BoolValue.internalBinaryWrite(message.valueBool, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.Timestamp value_date_time = 4; */
        if (message.valueDateTime)
            Timestamp.internalBinaryWrite(message.valueDateTime, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.Int64Value value_int64 = 5; */
        if (message.valueInt64)
            Int64Value.internalBinaryWrite(message.valueInt64, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.DoubleValue value_real = 6; */
        if (message.valueReal)
            DoubleValue.internalBinaryWrite(message.valueReal, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.StringValue value_string = 7; */
        if (message.valueString)
            StringValue.internalBinaryWrite(message.valueString, writer.tag(7, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.Duration value_duration = 8; */
        if (message.valueDuration)
            Duration.internalBinaryWrite(message.valueDuration, writer.tag(8, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.TableKeyValue
 */
export const TableKeyValue = new TableKeyValue$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TableRow$Type extends MessageType<TableRow> {
    constructor() {
        super("api.v1.TableRow", [
            { no: 1, name: "columns", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => TableKeyValue }
        ]);
    }
    create(value?: PartialMessage<TableRow>): TableRow {
        const message = { columns: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<TableRow>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TableRow): TableRow {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated api.v1.TableKeyValue columns */ 1:
                    message.columns.push(TableKeyValue.internalBinaryRead(reader, reader.uint32(), options));
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
    internalBinaryWrite(message: TableRow, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated api.v1.TableKeyValue columns = 1; */
        for (let i = 0; i < message.columns.length; i++)
            TableKeyValue.internalBinaryWrite(message.columns[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.TableRow
 */
export const TableRow = new TableRow$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TableColumn$Type extends MessageType<TableColumn> {
    constructor() {
        super("api.v1.TableColumn", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "type", kind: "enum", T: () => ["api.v1.TableColumn.Type", TableColumn_Type, "TYPE_"] }
        ]);
    }
    create(value?: PartialMessage<TableColumn>): TableColumn {
        const message = { key: "", type: 0 };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<TableColumn>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TableColumn): TableColumn {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                case /* api.v1.TableColumn.Type type */ 2:
                    message.type = reader.int32();
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
    internalBinaryWrite(message: TableColumn, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        /* api.v1.TableColumn.Type type = 2; */
        if (message.type !== 0)
            writer.tag(2, WireType.Varint).int32(message.type);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.TableColumn
 */
export const TableColumn = new TableColumn$Type();
// @generated message type with reflection information, may provide speed optimized methods
class TableSchema$Type extends MessageType<TableSchema> {
    constructor() {
        super("api.v1.TableSchema", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "type", kind: "enum", T: () => ["api.v1.TableSchema.Type", TableSchema_Type, "TYPE_"] },
            { no: 3, name: "columns", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => TableColumn },
            { no: 4, name: "session_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<TableSchema>): TableSchema {
        const message = { id: "", type: 0, columns: [], sessionId: "", name: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<TableSchema>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: TableSchema): TableSchema {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* api.v1.TableSchema.Type type */ 2:
                    message.type = reader.int32();
                    break;
                case /* repeated api.v1.TableColumn columns */ 3:
                    message.columns.push(TableColumn.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* string session_id */ 4:
                    message.sessionId = reader.string();
                    break;
                case /* string name */ 5:
                    message.name = reader.string();
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
    internalBinaryWrite(message: TableSchema, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* api.v1.TableSchema.Type type = 2; */
        if (message.type !== 0)
            writer.tag(2, WireType.Varint).int32(message.type);
        /* repeated api.v1.TableColumn columns = 3; */
        for (let i = 0; i < message.columns.length; i++)
            TableColumn.internalBinaryWrite(message.columns[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* string session_id = 4; */
        if (message.sessionId !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.sessionId);
        /* string name = 5; */
        if (message.name !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message api.v1.TableSchema
 */
export const TableSchema = new TableSchema$Type();
