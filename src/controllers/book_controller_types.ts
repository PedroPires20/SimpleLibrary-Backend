import * as express from "express";
import type { BookSchema } from "models/book";
import { ExcludeId, SortBySchema } from "models/model";
import { ObjectId } from "mongodb";

export namespace HandlerTypes {
    export namespace GetBookById {
        interface RouteParameters {
            id: string
        }

        export type Request = express.Request<
            RouteParameters,
            BookSchema,
            {},
            {}
        >;
        export type Response = express.Response<BookSchema>;
    }

    export namespace ListBooks {
        interface QueryParameters {
            page?: string
        }

        interface RequestBody {
            booksPerPage?: number,
            sortBy?: SortBySchema<BookSchema>
        }

        export type Request = express.Request<
            {},
            BookSchema[],
            RequestBody,
            QueryParameters
        >;

        export type Response = express.Response<BookSchema[]>;
    }

    export namespace CreateBook {
        interface ResponseBody {
            createdId: ObjectId
        }

        export type Request = express.Request<
            {},
            ResponseBody,
            ExcludeId<BookSchema>,
            {}
        >;

        export type Response = express.Response<ResponseBody>;
    }

    export namespace UpdateBook {
        interface RouteParameters {
            id: string
        }

        export type Request = express.Request<
            RouteParameters,
            {},
            Partial<BookSchema>,
            {}
        >;
        export type Response = express.Response<{}>;
    }

    export namespace DeleteBook {
        interface RouteParameters {
            id: string
        }

        export type Request = express.Request<
            RouteParameters,
            {},
            {},
            {}
        >;
        export type Response = express.Response<{}>;
    }
}