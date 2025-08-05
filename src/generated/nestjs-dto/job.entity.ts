
import {Company} from './company.entity'
import {JobTag} from './jobTag.entity'
import {JobMetadata} from './jobMetadata.entity'
import {JobSource} from './jobSource.entity'


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
tags?: JobTag[] ;
metadata?: JobMetadata[] ;
sources?: JobSource[] ;
}
