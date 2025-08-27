import { TraceService as NestTraceService } from '@metinseylan/nestjs-opentelemetry';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { Span } from '@opentelemetry/api';
import { ClassDeclaration } from 'typescript';

@Injectable({ scope: Scope.TRANSIENT })
export class TraceService extends NestTraceService {
  constructor(@Inject(INQUIRER) private readonly inquirer: ClassDeclaration) {
    super();
  }

  startSpan(method: string, context?: string): Span {
    let name = `Provider->${this.inquirer?.constructor.name}.${method}`;

    if (context) {
      name += ` (${context})`;
    }

    return super.startSpan(name);
  }

  startSpanRaw(name: string): Span {
    return super.startSpan(name);
  }
}
