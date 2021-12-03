//
//  SocketBridge.m
//  RNSwiftSocketIO
//

#import "React/RCTBridge.h"
#import "React/RCTEventEmitter.h"
@interface RCT_EXTERN_MODULE(SocketIO, NSObject)

RCT_EXTERN_METHOD(initialise:(NSString*)connection config:(NSDictionary*)config)
RCT_EXTERN_METHOD(addHandlers:(NSDictionary*)handlers)
RCT_EXTERN_METHOD(connect)
RCT_EXTERN_METHOD(close:(BOOL)fast)
RCT_EXTERN_METHOD(reconnect)

@end
