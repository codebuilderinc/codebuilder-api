
import {Subscription} from './subscription.entity'


export class Location {
  id: number ;
ipAddress: string ;
accuracy: number  | null;
altitude: number  | null;
altitudeAccuracy: number  | null;
heading: number  | null;
latitude: number  | null;
longitude: number  | null;
speed: number  | null;
mocked: boolean ;
timestamp: bigint  | null;
city: string  | null;
country: string  | null;
district: string  | null;
formattedAddress: string  | null;
isoCountryCode: string  | null;
name: string  | null;
postalCode: string  | null;
region: string  | null;
street: string  | null;
streetNumber: string  | null;
subregion: string  | null;
timezone: string  | null;
createdAt: Date ;
subscriptionId: number ;
subscription?: Subscription ;
}
