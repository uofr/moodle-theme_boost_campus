// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Theme Boost Campus - Code for course header image uploader.
 *
 * @package    theme_urcourses_default
 * @author     John Lane
 * 
 */

define(['jquery', 'core/ajax', 'core/notification', 'core/str',
    'core/modal_factory', 'core/modal_events'], function($, ajax, notification, str, ModalFactory, ModalEvents) {

    /** Container jquery object. */
    var _root;
    /** Course ID */
    var _courseid;
    
    var _element;

    /** Jquery selector strings. */
    var SELECTORS = {
        HEADER: '#page-header .header-body',
        HEADER_TOP: "#page-header .page-head",
        BTN_COURSEENROL: '#btn_courseenrol',
        BTN_ENROLTERM: '.btn_enrolterm',
    };

    /**
     * Initializes global variables.
     * @param {string} root - Jquery selector for container.
     * @param {int} headerstyle - selected header style.
     * @param {int} courseid - ID of current course.
     * @return void
     */
    var _setGlobals = function(root, courseid) {
       _root = $(root);
       _courseid = courseid;
       
       console.log('set globals for course_enrolment');
    };

    /**
     * Sets up event listeners.
     * @return void
     */
    var _registerEventListeners = function() {
        _root.on('click', SELECTORS.BTN_ENROLTERM, _courseenrolAction);
        console.log('course enrolment event listeners registered');
    };

    /**
     * Initiate ajax call to upload and set new image.
     */
    var _courseenrolAction = function() {
        _element = $(this);
        
        console.log('triggered course enrol: '+_element.attr('id'));

        //if current style is clicked, do nothing...
        //console.log('_headerstyle:'+_headerstyle);
        /*
        if ('#'+_element.attr('id') == SELECTORS.HDRSTYLEA_BTN && _headerstyle == 0) {
            return;
        } else if ('#'+_element.attr('id') == SELECTORS.HDRSTYLEB_BTN && _headerstyle == 1) {
            return;
        }
        */
        my_crns = {'ss2020': [12897,12874,23332],'f2020': [12345,32443],'w2021': [12764]};
        
        crnlist = '<ul>';
        
        for (m in my_crns['ss2020']) {
            crnlist += '<li>'+my_crns['ss2020'][m]+'</li>';
        }
        
        crnlist += '</ul>';
        
        //adding in confirmation modal in case buttons accidentally clicked
        ModalFactory.create({
            type: ModalFactory.types.SAVE_CANCEL,
            title: 'Modify enrolment',
            body: "<p><b>Are you sure you want to modify enrolment for this course?</b><br />"
                  + "<small>The following CRNs are available for the selected term:</small>"
                  + crnlist
                  + "</p>"
        })
        .then(function(modal) {
            modal.setSaveButtonText('Save');
            var root = modal.getRoot();
            root.on(ModalEvents.cancel, function(){
                return;
            });
            root.on(ModalEvents.save, _styleChange);
            modal.show();
        });
    };


    var _styleChange = function() {
        
        
        alert('#'+_element.attr('id'));
        
/*
        // return if required values aren't set
        if (!_courseid) {
            return;
        }

        // set args
        var args = {
            courseid: _courseid,
            headerstyle: _headerstyle,
        };

        // set ajax call
        var ajaxCall = {
            methodname: 'theme_urcourses_default_header_choose_style',
            args: args,
            done: _choiceDone,
            fail: notification.exception
        };

        // initiate ajax call
        ajax.call([ajaxCall]);
        
    */
        
    };
    /**
     * Handles theme_urcourses_default_upload_course_image response data.
     * @param {Object} response 
     */
    var _choiceDone = function() {
        str.get_string('success:coursestylechosen', 'theme_urcourses_default')
            .done(_createSuccessPopup);
    };

    /**
     * Creates a bootstrap dismissable containing success text.
     * Dismissable should appear in header and should cover upload button.
     * @param {string} text Success text.
     */
    var _createSuccessPopup = function(text) {
        // create bootstrap 4 dismissable
        var popup = $('<div></div>');
        popup.text(text);
        popup.prop('id','cstyle_success_popup');
        popup.css({'position' : 'absolute'});
        popup.css({'right' : '5px'});
        popup.css({'bottom' : '30px'});
        popup.css({'z-index' : '1200'});
        popup.addClass('alert alert-success alert-dismissable fade show');

        // create dismiss button
        var dismissBtn = $('<button></button>');
        dismissBtn.html('&times;');
        dismissBtn.addClass('close');
        dismissBtn.attr('type', 'button');
        dismissBtn.attr('data-dismiss', 'alert');

        // append dismiss button to popup
        popup.append(dismissBtn);

        // add to header's course image area
        $(SELECTORS.HEADER_TOP).append(popup);

        // makes the alert disapear after a set amout of time.
        setTimeout(function() {
            $('#cstyle_success_popup').fadeTo(500, 0).slideUp(500, function(){
                $(this).remove();
            });
        },1800);
    };

    /**
     * Entry point to module. Sets globals and registers event listeners.
     * @param {String} root Jquery selector for container.
     * @return void
     */
    var init = function(root, courseid) {
        _setGlobals(root, courseid);
        _registerEventListeners();
    };

    return {
        init: init
    };

});