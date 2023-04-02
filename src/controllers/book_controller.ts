import { Controller, DatabaseSettings, HttpMethod } from "./controller";
import { HandlerTypes } from "./book_controller_types";
import Book from "../models/book";
import { ApiError } from "../helpers/error_handlers";

export default class BookController extends Controller {
    constructor(databaseConfiguration: DatabaseSettings) {
        super(databaseConfiguration);
    }

    public async getBookById(
        request: HandlerTypes.GetBookById.Request,
        response:  HandlerTypes.GetBookById.Response
    ) {
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                "BookController"
            );
        }
        let id = Book.getIdFromString(request.params.id);
        let book = await Book.getBookById(id);
        response.status(200).json(book.getAllFields());
    }

    public async listBooks(
        request: HandlerTypes.ListBooks.Request,
        response: HandlerTypes.ListBooks.Response
    ) {
        const DEFAULT_BOOKS_PER_PAGE = 10;

        let booksToSkip: number;
        let limit: number;
        if(request.query.page) {
            let page = parseInt(request.query.page);
            if(isNaN(page) || page <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the pages parameter! The number of pages must be a positive integer (got value {${request.query.page}} of type "${typeof request.query.page}").`,
                    400,
                    "BookController"
                );
            }
            if(typeof request.body.booksPerPage !== "number" || request.body.booksPerPage <= 0) {
                throw new ApiError(
                    `An invalid value was provided to the booksPerPage property! The booksPerPage property must be a positive integer (got value {${request.body.booksPerPage}} of type "${typeof request.body.booksPerPage}").`,
                    400,
                    "BookController"
                )
            }
            let booksPerPage = request.body.booksPerPage || DEFAULT_BOOKS_PER_PAGE;
            booksToSkip = (page - 1) * booksPerPage;
            limit = booksPerPage;
        }else {
            booksToSkip = limit = 0;
        }
        if(!request.body.sortBy && typeof request.body.sortBy !== "object") {
            throw new ApiError(
                `The sort by property, if provided, must be a valid object. The provided value was of type "${typeof request.body.sortBy}".`,
                400,
                "BookController"
            );
        }
        let books = await Book.queryBooks({}, booksToSkip, limit, request.body.sortBy);
        response.status(200).json(books.map(book => book.getAllFields()));
    }

    public async createBook(
        request: HandlerTypes.CreateBook.Request,
        response: HandlerTypes.CreateBook.Response
    ) {
        if(!Book.validateSchema(request.body)) {
            throw new ApiError(
                `The data provided for the creation of the new book is invalid! The data does not follow the Book schema.`,
                400,
                "BookController"
            );
        }
        let newBook = await Book.createBook(request.body);
        response.status(200).json({ createdId: newBook.id });
    }

    public async updateBook(
        request: HandlerTypes.UpdateBook.Request,
        response: HandlerTypes.UpdateBook.Response
    ) {
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                "BookController"
            );
        }
        let id = Book.getIdFromString(request.params.id);
        let book = await Book.getBookById(id);
        if(!Book.validateUpdateSchema(request.body)) {
            throw new ApiError(
                `The provided updated data is invalid! The fields doesn't follow the Book schema.`,
                400,
                "BookController"
            );
        }
        book.updateFields(request.body);
        try {
            await book.commitChanges();
        }catch(exception: any) {
            await book.reload();
            throw new ApiError(
                `An error was encountered while updating the book with id="${id}". Any changes mede where rolled back. Error: ${exception}`
            );
        }
        response.status(200).send();
    }

    public async deleteBook(
        request: HandlerTypes.DeleteBook.Request,
        response: HandlerTypes.DeleteBook.Response
    ) {
        if(!Book.isValidId(request.params.id)) {
            throw new ApiError(
                `The provided book id is invalid! The string "${request.params.id}" not a valid MongoDB ObjectId!`,
                400,
                "BookController"
            );
        }
        let id = Book.getIdFromString(request.params.id);
        await Book.deleteBookById(id);
        response.status(200).send();
    }

    protected _initializeModels() {
        Book.initializeModel(
            this._databaseConfiguration.serverUrl,
            this._databaseConfiguration.serverPort,
            this._databaseConfiguration.databaseName
        ).then(() => { this._isReady = true })
        .catch((exception) => { throw new ApiError(`Book model initialization failed with the following error: ${exception}`); } );
    }

    protected _initializeRoutes() {
       this._registerRoute(HttpMethod.GET, "/:id", this.getBookById);
       this._registerRoute(HttpMethod.GET, "/", this.listBooks);
       this._registerRoute(HttpMethod.POST, "/", this.createBook);
       this._registerRoute(HttpMethod.PATCH, "/:id", this.updateBook);
       this._registerRoute(HttpMethod.DELETE, "/:id", this.deleteBook);
    }
}