// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "api/v1/service.proto" (package "api.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { APIService } from "./service";
import type { QueryTableResponse } from "./service";
import type { QueryTableRequest } from "./service";
import type { CreateParsedTableResponse } from "./service";
import type { CreateParsedTableRequest } from "./service";
import type { UpdateSessionResponse } from "./service";
import type { UpdateSessionRequest } from "./service";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ListSessionsResponse } from "./service";
import type { ListSessionsRequest } from "./service";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service api.v1.APIService
 */
export interface IAPIServiceClient {
    /**
     * @generated from protobuf rpc: ListSessions(api.v1.ListSessionsRequest) returns (api.v1.ListSessionsResponse);
     */
    listSessions(input: ListSessionsRequest, options?: RpcOptions): UnaryCall<ListSessionsRequest, ListSessionsResponse>;
    /**
     * @generated from protobuf rpc: UpdateSession(api.v1.UpdateSessionRequest) returns (api.v1.UpdateSessionResponse);
     */
    updateSession(input: UpdateSessionRequest, options?: RpcOptions): UnaryCall<UpdateSessionRequest, UpdateSessionResponse>;
    /**
     * @generated from protobuf rpc: CreateParsedTable(api.v1.CreateParsedTableRequest) returns (api.v1.CreateParsedTableResponse);
     */
    createParsedTable(input: CreateParsedTableRequest, options?: RpcOptions): UnaryCall<CreateParsedTableRequest, CreateParsedTableResponse>;
    /**
     * @generated from protobuf rpc: QueryTable(api.v1.QueryTableRequest) returns (api.v1.QueryTableResponse);
     */
    queryTable(input: QueryTableRequest, options?: RpcOptions): UnaryCall<QueryTableRequest, QueryTableResponse>;
}
/**
 * @generated from protobuf service api.v1.APIService
 */
export class APIServiceClient implements IAPIServiceClient, ServiceInfo {
    typeName = APIService.typeName;
    methods = APIService.methods;
    options = APIService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: ListSessions(api.v1.ListSessionsRequest) returns (api.v1.ListSessionsResponse);
     */
    listSessions(input: ListSessionsRequest, options?: RpcOptions): UnaryCall<ListSessionsRequest, ListSessionsResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ListSessionsRequest, ListSessionsResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: UpdateSession(api.v1.UpdateSessionRequest) returns (api.v1.UpdateSessionResponse);
     */
    updateSession(input: UpdateSessionRequest, options?: RpcOptions): UnaryCall<UpdateSessionRequest, UpdateSessionResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateSessionRequest, UpdateSessionResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: CreateParsedTable(api.v1.CreateParsedTableRequest) returns (api.v1.CreateParsedTableResponse);
     */
    createParsedTable(input: CreateParsedTableRequest, options?: RpcOptions): UnaryCall<CreateParsedTableRequest, CreateParsedTableResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateParsedTableRequest, CreateParsedTableResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: QueryTable(api.v1.QueryTableRequest) returns (api.v1.QueryTableResponse);
     */
    queryTable(input: QueryTableRequest, options?: RpcOptions): UnaryCall<QueryTableRequest, QueryTableResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<QueryTableRequest, QueryTableResponse>("unary", this._transport, method, opt, input);
    }
}
