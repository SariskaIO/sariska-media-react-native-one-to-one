#import <Foundation/Foundation.h>
#import "test.h"
#import "privateheader.h"

@implementation Participant

@synthesize status;


- (Participant *)initWithOptions: (NSDictionary *) m  {
    status = m[@"status"];
    return self;
}

- (NSString *)getStatus {
    return status;
}

@end
