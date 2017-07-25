$(document)
    .ready(function() {
        /******************************
         * STATIC VARIABLES
         ******************************/
        let PREVIEW_IMAGE = $('.current-image img')
            , GALLERY = $('#slideshow');

        /******************************
         * EVENT LISTENERS
         ******************************/
        GALLERY.find('.thumb')
            .on('click', function() {
                loadClickedImage($(this)
                    .data('thumb-id'));
            });
        GALLERY.find('#prev-btn')
            .on('click', function(e) {
                e.preventDefault();
                slide(false);
            });
        GALLERY.find('#next-btn')
            .on('click', function(e) {
                e.preventDefault();
                slide(true);
            });
        $(document)
            .keydown(function(e) {
                switch (e.keyCode) {
                    // Up arrow press
                    case 38:
                        e.preventDefault()
                        slide(false);
                        break;
                        // Down arrow press
                    case 40:
                        e.preventDefault()
                        slide(true);
                        break;
                    default:
                        break;
                }
            });

        /******************************
         * GALLERY FUNCTIONS
         ******************************/
        let slide = function(next = true) {

            let active = GALLERY.find('.thumb.active');
            if (active.length === 0) {
                active = GALLERY.find('.thumb:last');
            }

            // Setting next image & thumb properties
            if (next)
                loadNextImage(active);
            else
                loadPrevImage(active);
        };

        let loadNextImage = function(active) {
            let next = active.next(".thumb")
                .length ? active.next(".thumb") : GALLERY.find('.thumb:first')
                , nextThumb = GALLERY.find('[data-thumb-id="' + next.data('thumb-id') + '"]')
                , image = nextThumb.find('a img')
                .attr('src');

            // Setting next image & thumb properties
            GALLERY.find('.thumb')
                .removeClass('active');
            PREVIEW_IMAGE.attr('src', image);
            nextThumb.addClass('active');

            // Transitioning to next image & thumbnail
            scrollThumbnails(nextThumb);
        };

        let loadPrevImage = function(active) {
            let prev = active.prev(".thumb")
                .length ? active.prev(".thumb") : GALLERY.find('.thumb:last')
                , prevThumb = GALLERY.find('[data-thumb-id="' + prev.data('thumb-id') + '"]')
                , image = prevThumb.find('a img')
                .attr('src');

            // Setting next image & thumb properties
            GALLERY.find('.thumb')
                .removeClass('active');
            PREVIEW_IMAGE.attr('src', image);
            prevThumb.addClass('active');

            // Transitioning to next image & thumbnail
            scrollThumbnails(prevThumb);
        };

        let loadClickedImage = function(id) {
            let imgThumb = GALLERY.find('[data-thumb-id="' + id + '"]')
                , image = imgThumb.find('a img')
                .attr('src')
                , currActive = GALLERY.find('.thumb.active');

            // Setting image & thumb properties
            GALLERY.find('.thumb')
                .removeClass('active');
            PREVIEW_IMAGE.attr('src', image);
            currActive.addClass('last-active')
                .removeClass('active');
            imgThumb.addClass('active');

            // Transitioning to image & thumbnail
            scrollThumbnails(imgThumb);
        };

        let scrollThumbnails = function(thumb) {
            let offset, // used for thumbnail offset
                first, // stores first thumbnail object
                y = thumb.position()
                .top + parseInt(thumb.css('margin-top'), 10);

            let currOffset = (y + thumb.height() + 15) - thumb.parent()
                .height();

            if (y < 0) {
                first = GALLERY.find('.thumb:first');
                offset = parseInt(first.css('margin-top'), 10) - y;
                first.animate({
                    marginTop: offset
                }, 100);
            } else {
                if (currOffset > 0) {
                    first = GALLERY.find('.thumb:first');
                    offset = parseInt(first.css('margin-top'), 10) - currOffset;

                    first.animate({
                        marginTop: offset
                    }, 100)
                }
            }
        };
    });
