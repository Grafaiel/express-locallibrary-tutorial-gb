const Author = require('../models/author');
const async = require('async');
const Book = require('../models/book');
const { body, validationResult} = require('express-validator');


// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function  (err, list_authors) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('author_list', { title: 'Lista de Autores', author_list: list_authors});
        });
};

// Display detail page   for a specific Author.
exports.author_detail = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id}, 'title summary')
                .exec(callback)
        },
    }, function(err, results) {
        if(err) { return next(err); } // Error in API usage.
        if(results.author==null) { // No results
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render( 'author_detail', { title: 'Detalhes do Autor', author: results.author, author_books: results.authors_books } );
    });
    
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', { title: 'Criar Autor'});
};

// Handle Author create on POST.
exports.author_create_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('Primeiro nome deve ser preenchido.').isAlphanumeric().withMessage('O primeiro nome possui caracteres não alfanuméricos.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Segundo nome deve ser preenchido').isAlphanumeric().withMessage('O segundo nome possui caracteres não alfanuméricos.'),
    body('date_of_birth', 'Data de nascimento inválida.').optional( { checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Data de morte inválida.').optional( { checkFalsy: true }).isISO8601().toDate(),
    
    // Process request after validation and sanitization.
    function(req, res, next) {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', {title: 'Criar Autor', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            const author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });
            author.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];


// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render
        res.render('author_delete', {title: 'Deletar Autor', author: results.author, author_books: results.authors_books} );
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render ir same way as for GET route.
            res.render('author_delete', { title: 'Deletar Autor', author: results.author, author_books: results.authors_books} );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if(err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    
    // GET author for form
    Author.findById(req.params.id, function(err, author) {
        if (err) {return next(err);}
        if (author==null) { // NO results.
            const err = new Error('Autor não encontrado');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('author_form', {title: 'Atualizar Autor', author: author});
    });
};

// Handle Author update on POST.
exports.author_update_post = [
    
    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('Primeiro nome deve ser preenchido.').isAlphanumeric().withMessage('O primeiro nome possui caracteres não alfanuméricos.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Segundo nome deve ser preenchido').isAlphanumeric().withMessage('O segundo nome possui caracteres não alfanuméricos.'),
    body('date_of_birth', 'Data de nascimento inválida.').optional( { checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Data de morte inválida.').optional( { checkFalsy: true }).isISO8601().toDate(),
    
    function(req, res, next) {
            
        //Extract the validation error from a request.
        const errors = validationResult(req);

        // create a athor object with escaped and trimmed data
        const author = new Author (
        {   
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id //This is required, or a new ID will be assigned.

        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/ error message.
            res.render('author_form', {title: 'Atualizar Autor', author: author, errors: errors.array()});
            return;
        }
        else {
            Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
                if(err, theauthor) {
                    if (err) {return next(err);}
                    // Successful - Redirect to author detail page.
                    res.redirect(theauthor.url);
                }
            });
        }
    }
];
