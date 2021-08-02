import { Injectable } from '@nestjs/common'
import { FilterQuery } from 'mongoose'
import { Types } from 'mongoose'

interface PaginationQuery<T> {
    query: FilterQuery<T>
    sort: number
}

@Injectable()
export class PaginationService {
    generatePaginationQuery<T>(cursor: string, addQuery?: FilterQuery<T>, sort = -1): PaginationQuery<T> {
        const isAsc = (): boolean => sort == 1
        let query = cursor
            ? {
                  _id: { [isAsc() ? '$gt' : '$lt']: Types.ObjectId(cursor) },
              }
            : {}
        if (addQuery) query = Object.assign(query, addQuery)
        return { query, sort }
    }
}
