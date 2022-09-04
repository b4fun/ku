// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.28.1
// 	protoc        (unknown)
// source: api/v1/service.proto

package v1

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ListSessionsRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *ListSessionsRequest) Reset() {
	*x = ListSessionsRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_v1_service_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ListSessionsRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListSessionsRequest) ProtoMessage() {}

func (x *ListSessionsRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_v1_service_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListSessionsRequest.ProtoReflect.Descriptor instead.
func (*ListSessionsRequest) Descriptor() ([]byte, []int) {
	return file_api_v1_service_proto_rawDescGZIP(), []int{0}
}

type ListSessionsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Sessions []*Session `protobuf:"bytes,1,rep,name=sessions,proto3" json:"sessions,omitempty"`
}

func (x *ListSessionsResponse) Reset() {
	*x = ListSessionsResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_v1_service_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ListSessionsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListSessionsResponse) ProtoMessage() {}

func (x *ListSessionsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_v1_service_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListSessionsResponse.ProtoReflect.Descriptor instead.
func (*ListSessionsResponse) Descriptor() ([]byte, []int) {
	return file_api_v1_service_proto_rawDescGZIP(), []int{1}
}

func (x *ListSessionsResponse) GetSessions() []*Session {
	if x != nil {
		return x.Sessions
	}
	return nil
}

type QueryTableRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// sql specifies the sql query to run
	Sql string `protobuf:"bytes,1,opt,name=sql,proto3" json:"sql,omitempty"`
}

func (x *QueryTableRequest) Reset() {
	*x = QueryTableRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_v1_service_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *QueryTableRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*QueryTableRequest) ProtoMessage() {}

func (x *QueryTableRequest) ProtoReflect() protoreflect.Message {
	mi := &file_api_v1_service_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use QueryTableRequest.ProtoReflect.Descriptor instead.
func (*QueryTableRequest) Descriptor() ([]byte, []int) {
	return file_api_v1_service_proto_rawDescGZIP(), []int{2}
}

func (x *QueryTableRequest) GetSql() string {
	if x != nil {
		return x.Sql
	}
	return ""
}

type QueryTableResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Rows    []*TableRow    `protobuf:"bytes,1,rep,name=rows,proto3" json:"rows,omitempty"`
	Columns []*TableColumn `protobuf:"bytes,2,rep,name=columns,proto3" json:"columns,omitempty"`
}

func (x *QueryTableResponse) Reset() {
	*x = QueryTableResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_api_v1_service_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *QueryTableResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*QueryTableResponse) ProtoMessage() {}

func (x *QueryTableResponse) ProtoReflect() protoreflect.Message {
	mi := &file_api_v1_service_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use QueryTableResponse.ProtoReflect.Descriptor instead.
func (*QueryTableResponse) Descriptor() ([]byte, []int) {
	return file_api_v1_service_proto_rawDescGZIP(), []int{3}
}

func (x *QueryTableResponse) GetRows() []*TableRow {
	if x != nil {
		return x.Rows
	}
	return nil
}

func (x *QueryTableResponse) GetColumns() []*TableColumn {
	if x != nil {
		return x.Columns
	}
	return nil
}

var File_api_v1_service_proto protoreflect.FileDescriptor

var file_api_v1_service_proto_rawDesc = []byte{
	0x0a, 0x14, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65,
	0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x06, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x1a, 0x12,
	0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x22, 0x15, 0x0a, 0x13, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x73, 0x73, 0x69, 0x6f,
	0x6e, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x43, 0x0a, 0x14, 0x4c, 0x69, 0x73,
	0x74, 0x53, 0x65, 0x73, 0x73, 0x69, 0x6f, 0x6e, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x12, 0x2b, 0x0a, 0x08, 0x73, 0x65, 0x73, 0x73, 0x69, 0x6f, 0x6e, 0x73, 0x18, 0x01, 0x20,
	0x03, 0x28, 0x0b, 0x32, 0x0f, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x65, 0x73,
	0x73, 0x69, 0x6f, 0x6e, 0x52, 0x08, 0x73, 0x65, 0x73, 0x73, 0x69, 0x6f, 0x6e, 0x73, 0x22, 0x25,
	0x0a, 0x11, 0x51, 0x75, 0x65, 0x72, 0x79, 0x54, 0x61, 0x62, 0x6c, 0x65, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x10, 0x0a, 0x03, 0x73, 0x71, 0x6c, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x03, 0x73, 0x71, 0x6c, 0x22, 0x69, 0x0a, 0x12, 0x51, 0x75, 0x65, 0x72, 0x79, 0x54, 0x61,
	0x62, 0x6c, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x24, 0x0a, 0x04, 0x72,
	0x6f, 0x77, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x10, 0x2e, 0x61, 0x70, 0x69, 0x2e,
	0x76, 0x31, 0x2e, 0x54, 0x61, 0x62, 0x6c, 0x65, 0x52, 0x6f, 0x77, 0x52, 0x04, 0x72, 0x6f, 0x77,
	0x73, 0x12, 0x2d, 0x0a, 0x07, 0x63, 0x6f, 0x6c, 0x75, 0x6d, 0x6e, 0x73, 0x18, 0x02, 0x20, 0x03,
	0x28, 0x0b, 0x32, 0x13, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x54, 0x61, 0x62, 0x6c,
	0x65, 0x43, 0x6f, 0x6c, 0x75, 0x6d, 0x6e, 0x52, 0x07, 0x63, 0x6f, 0x6c, 0x75, 0x6d, 0x6e, 0x73,
	0x32, 0xa0, 0x01, 0x0a, 0x0a, 0x41, 0x50, 0x49, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12,
	0x4b, 0x0a, 0x0c, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x73, 0x73, 0x69, 0x6f, 0x6e, 0x73, 0x12,
	0x1b, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x73,
	0x73, 0x69, 0x6f, 0x6e, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1c, 0x2e, 0x61,
	0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x4c, 0x69, 0x73, 0x74, 0x53, 0x65, 0x73, 0x73, 0x69, 0x6f,
	0x6e, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x12, 0x45, 0x0a, 0x0a,
	0x51, 0x75, 0x65, 0x72, 0x79, 0x54, 0x61, 0x62, 0x6c, 0x65, 0x12, 0x19, 0x2e, 0x61, 0x70, 0x69,
	0x2e, 0x76, 0x31, 0x2e, 0x51, 0x75, 0x65, 0x72, 0x79, 0x54, 0x61, 0x62, 0x6c, 0x65, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1a, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x51,
	0x75, 0x65, 0x72, 0x79, 0x54, 0x61, 0x62, 0x6c, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x22, 0x00, 0x42, 0x08, 0x5a, 0x06, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_api_v1_service_proto_rawDescOnce sync.Once
	file_api_v1_service_proto_rawDescData = file_api_v1_service_proto_rawDesc
)

func file_api_v1_service_proto_rawDescGZIP() []byte {
	file_api_v1_service_proto_rawDescOnce.Do(func() {
		file_api_v1_service_proto_rawDescData = protoimpl.X.CompressGZIP(file_api_v1_service_proto_rawDescData)
	})
	return file_api_v1_service_proto_rawDescData
}

var file_api_v1_service_proto_msgTypes = make([]protoimpl.MessageInfo, 4)
var file_api_v1_service_proto_goTypes = []interface{}{
	(*ListSessionsRequest)(nil),  // 0: api.v1.ListSessionsRequest
	(*ListSessionsResponse)(nil), // 1: api.v1.ListSessionsResponse
	(*QueryTableRequest)(nil),    // 2: api.v1.QueryTableRequest
	(*QueryTableResponse)(nil),   // 3: api.v1.QueryTableResponse
	(*Session)(nil),              // 4: api.v1.Session
	(*TableRow)(nil),             // 5: api.v1.TableRow
	(*TableColumn)(nil),          // 6: api.v1.TableColumn
}
var file_api_v1_service_proto_depIdxs = []int32{
	4, // 0: api.v1.ListSessionsResponse.sessions:type_name -> api.v1.Session
	5, // 1: api.v1.QueryTableResponse.rows:type_name -> api.v1.TableRow
	6, // 2: api.v1.QueryTableResponse.columns:type_name -> api.v1.TableColumn
	0, // 3: api.v1.APIService.ListSessions:input_type -> api.v1.ListSessionsRequest
	2, // 4: api.v1.APIService.QueryTable:input_type -> api.v1.QueryTableRequest
	1, // 5: api.v1.APIService.ListSessions:output_type -> api.v1.ListSessionsResponse
	3, // 6: api.v1.APIService.QueryTable:output_type -> api.v1.QueryTableResponse
	5, // [5:7] is the sub-list for method output_type
	3, // [3:5] is the sub-list for method input_type
	3, // [3:3] is the sub-list for extension type_name
	3, // [3:3] is the sub-list for extension extendee
	0, // [0:3] is the sub-list for field type_name
}

func init() { file_api_v1_service_proto_init() }
func file_api_v1_service_proto_init() {
	if File_api_v1_service_proto != nil {
		return
	}
	file_api_v1_model_proto_init()
	if !protoimpl.UnsafeEnabled {
		file_api_v1_service_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ListSessionsRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_v1_service_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ListSessionsResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_v1_service_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*QueryTableRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_api_v1_service_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*QueryTableResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_api_v1_service_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   4,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_api_v1_service_proto_goTypes,
		DependencyIndexes: file_api_v1_service_proto_depIdxs,
		MessageInfos:      file_api_v1_service_proto_msgTypes,
	}.Build()
	File_api_v1_service_proto = out.File
	file_api_v1_service_proto_rawDesc = nil
	file_api_v1_service_proto_goTypes = nil
	file_api_v1_service_proto_depIdxs = nil
}
