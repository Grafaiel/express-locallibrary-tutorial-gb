const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const async = require('async');

const { body, validationResult} = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if(err) { return next(err)}
            // Successful, so render.
            res.render('bookinstance_list',{ title:'Situação dos livros', bookinstance_list: list_bookinstances});
        })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            if (bookinstance==null) { // No Results.
                let err = new Error('Cópia de livro não encontrada.');
                err.status = 404;
            }
            // Successesful, so render.
            res.render('bookinstance_detail', { title: 'Cópia: '+bookinstance.book.title, bookinstance: bookinstance});
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    
    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('bookinstance_form', {title: 'Criar nova Cópia de livro', book_list:books});
        });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate and sanitise fields.
    body('book', 'Livro deve ser preenchido').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Impresso deve ser preenchido').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Data Inválida').trim().isLength({ min: 1 }).isISO8601().toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec( function(err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form',{tittle: 'Criar nova Cópia de livro', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
                });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                    // Successful - redirect to new record.
                    res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    async.parallel({
        bookinstances: function(callback){
            BookInstance.findById(req.params.id)
            .populate('book')
            .exec(callback);
        },
    },  function (err, results) {
            if (err) { return next(err); }
            if (results.bookinstances==null) { //No results.
                res.redirect('/catalog/bookinstances')
            }
            // Successful, so render
            res.render('bookinstance_delete', {title: 'Deletar Cópia', bookinstance: results.bookinstances})
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    
    async.parallel({
        bookinstances: function(callback) {
            BookInstance.findById(req.body.bookinstanceid).populate('book').exec(callback)
        },
    }, function (err, results) {
        if (err) { 
            return next(err); 
        // Success
        return;
        }
        else {
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteInstance(err) {
                if(err) { return next(err); }
                // Success - go to BookInstances List
                res.redirect('/catalog/bookinstances');
            });
        }
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

    // GET BookInstance for form
    async.parallel ({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        book: function(callback) {
            Book.find(callback);
        },
    },  function(err, results){
        if(err) {return next(err); }
        if (results.bookinstance==null) { // NO results.
            let err = new Error ('Cópia não encontrada');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('bookinstance_form', {title: 'Atualizar Situação', bookinstance: results.bookInstance, book_list: results.book, selected_book: results.bookinstance.book._id});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
     // Validate and sanitise fields.
     body('book', 'Livro deve ser preenchido').trim().isLength({ min: 1 }).escape(),
     body('imprint', 'Impresso deve ser preenchido').trim().isLength({ min: 1 }).escape(),
     body('status').escape(),
     body('due_back', 'Data Inválida').trim().isLength({ min: 1 }).isISO8601().toDate(),
     
     // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Update a BookInstance object with escaped and trimmed data.  
        const bookinstance = new BookInstance({ 
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id // This is required, or a new ID will be assigned!
        });

        if(!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            //Get all Books for form.
            async.parallel({
                books: function(callback) {
                    Book.find(callback);
                },
            },  function(err, books){ 
                    if (err) { return next(err); }
                    // Success
                    res.render('bookinstance_form', {title: 'Atualizar Cópia', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
                    return;
                });
        } else {
            // Data from form is valid. Update the record.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
                if(err) {return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(thebookinstance.url)
            });
        }
    }
];

