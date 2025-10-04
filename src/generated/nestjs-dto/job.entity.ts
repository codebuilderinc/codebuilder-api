
import {Prisma} from '@prisma/client'
import {Company} from './company.entity'
import {JobTag} from './jobTag.entity'
import {JobMetadata} from './jobMetadata.entity'


export class Job {
  id: number ;
title: string ;
companyId: number  | null;
company?: Company  | null;
author: string  | null;
location: string  | null;
url: string ;
postedAt: Date  | null;
description: string  | null;
isRemote: boolean  | null;
createdAt: Date ;
updatedAt: Date ;
source: string  | null;
externalId: string  | null;
data: Prisma.JsonValue  | null;
tags?: JobTag[] ;
metadata?: JobMetadata[] ;
}
