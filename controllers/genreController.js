const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');


// Display list of all Genre.
exports.genre_list = function (req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genre) {
            if (err) { return next(err); }
            //Ok, então Renderiza a página
            res.render('genre_list', { title: 'Lista de Genêros', genre_list: list_genre });
        })
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function (callback) {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.genre == null) { //No results.
            let err = new Error('Genêro não encontrado');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Detalhes dos Genêros', genre: results.genre, genre_books: results.genre_books });
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
    res.render('genre_form', { title: "Criar Genêro" });
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate and santize the name field
    body('name', 'Nome do genêro deve ser preenchido.').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a resquest.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Criar Genêro', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec(function (err, found_genre) {
                    if (err) { return next(err); }

                    if (found_genre) {
                        // Genre exists, redirect to it detail page.
                        res.redirect(found_genre.url);
                    }
                    else {

                        genre.save(function (err) {
                            if (err) { return next(err); }
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback)
        },
    }, function(err, results){
        if (err) { return next(err); }
        if (results.genre==null) { //No results.
            res.redirect('/catalog/genres');
        }
        // Successful, so render
        res.render('genre_delete', {title: 'Deletar Genêro', genre: results.genre, genre_books: results.genre_books})
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.genreid).exec(callback)
        },
        genre_books: function(callback) {
            Book.find( {'genre': req.params.genreid} ).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', {title: 'Deletar Genêrno', genre: results.genre, genre_books: results.genre_books} );
            return;
        }
        else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success - go to genre list
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {

    // Get genre for form 
    Genre.findById(req.params.id, function(err, genre) {
        if (err) { return next(err); }
        if (genre==null) { //No results.
            const err = new Error('Genêro não encontrado');
            err.status = 404;
            return next(err);
        }
        // Successes
        res.render('genre_form', {title: 'Atualizar Genêro', genre: genre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate and santize the name field
    body('name', 'Nome do genêro deve ser preenchido.').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a resquest.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre(
            {   name: req.body.name,
                _id: req.params.id // This is requirid, or a new ID will be assigned
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Atualizar Genêro', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec(function (err, found_genre) {
                    if (err) { return next(err); }

                    if (found_genre) {
                        // Genre exists, redirect to it detail page.
                        res.redirect(found_genre.url);
                    }
                    else {

                        Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
                            if (err) { return next(err); }
                            // Successful - Redirect to genre detail page.
                            res.redirect(thegenre.url);
                        });
                    }
                });
        }
    }
];
