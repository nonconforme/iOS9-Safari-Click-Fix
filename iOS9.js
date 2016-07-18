/**
 * iOS9 'click', 'mousedown' and 'mouseup' fix
 * ---------------------------------------------
 * Include this script in your poject to fix 'click', 'mousedown' and 'mouseup' event
 * handling for $(window), $(document), $('body') and $('html'). By default iOS9 Safari is
 * suppressing those events in some situations and without some magic they can't be rely on.
 * This fix is blocking native event handlers from firing
 * (in some rare cases event will reach it's destination)
 * and it handles native event handlers basing on 'touchstart' and 'touchend' event.
 * ---------------------------------------------
 * Use at your own risk
 */
$(document).on('click', function(){ console.log("DOC CLIcK !")});
$(document).on('click', 'div', function(){ console.log("DOC div CLIcK !")});
$(document).ready(function(){

  /** Device is not iOS. There's no need to hack the planet. */
  if( typeof navigator.userAgent == 'undefined' || ! navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ){
    return;
  }

  var EVENT_NAMESPACE = 'IOS9FIX';
  var MAX_DOM_DEPTH = 100;

  /**
   * Suppress event for $object.
   * @param $object
   * @param eventType
   */
  //var blockEventFor = function($object, eventType) {
  //
  //  $object.on(eventType + '.' + EVENT_NAMESPACE, function(event){
  //    event.stopImmediatePropagation();
  //  });
  //
  //  // move StopPropagation event to the beginning of event queue
  //  var eventQueue = $._data($object.get(0), "events")[eventType];
  //  var blockingEvent = eventQueue.pop();
  //  eventQueue.unshift(blockingEvent);
  //};


  var blockEventFor = function($object, eventType) {
    var eventQueue, eventRepo = new Array();

    if($._data($object.get(0),"events") !== undefined){
      eventQueue = $._data($object.get(0),"events")[eventType];
    }

    if(eventQueue !== undefined) {
      for(var i = 0; i < eventQueue.length; i++) {
        eventRepo.push({
          handler: eventQueue[i].handler,
          selector: eventQueue[i].selector,
          namespace: eventQueue[i].namespace
        });
      }
      $object.off(eventType);
    }

    $object.on(eventType + '.' + EVENT_NAMESPACE, function(event){
      event.stopImmediatePropagation();
    });

    for(var i = 0; i < eventRepo.length; i++) {

      var _eventType = eventRepo[i].namespace !== undefined
          ? eventType + '.' + eventRepo[i].namespace
          : eventType;

      $object.on(_eventType, eventRepo[i].selector, eventRepo[i].handler);
    }
  };


  /**
   * EXECUTE MOCKED-EVENT HANDLERS
   * @param object $object
   * @param string mockedEventType
   * @param object originalEvent
   */
  var executeMockedEventHandlers = function($object, mockedEventType, originalEvent){
    var mockedEventQueue, $target = $(originalEvent.target);

    if($._data($object.get(0), "events") !== undefined){
      mockedEventQueue = $._data($object.get(0), "events")[mockedEventType];
    }

    /** No event-handlers for event of such type */
    if(mockedEventQueue === undefined){
      return false;
    }

    //console.log(mockedEventQueue, MAX_DOM_DEPTH);

    /** Traverse DOM from 'target' to 'base' and execute mockedEventHandlers for all matched elements */
    for(var preventEndlessLoop = 0; preventEndlessLoop < MAX_DOM_DEPTH; preventEndlessLoop++){

     // console.log($target, $target.length);

      /** END THE LOOP */
      if($target.length == 0){
        break;
      }

      /** EXECUTE MOCKED EVENT HANDLERS */
      for(var i = 0; i < mockedEventQueue.length; i++){

       // console.log(i, mockedEventQueue[i]);

        // Skip eventHandler used to block originalEvent for mockedEvent
        if(mockedEventQueue[i].namespace === EVENT_NAMESPACE){
          continue;
        }

        if(mockedEventQueue[i].selector === undefined){
          // Skip $object level eventHandlers until current DOM level is $object level
          if( ! $target.is($object[0])) {
            continue;
          }
        } else {
          // Skip eventHandlers not meant for current DOM level
          if( ! $target.is(mockedEventQueue[i].selector)){
            continue;
          }
        }

        // Execute handler for current DOM level
        if(mockedEventQueue[i].handler.call($target[0], originalEvent) === false){
          originalEvent.stopImmediatePropagation();
        }

        // Check for stopImmediatePropagation() */
        if(originalEvent.isImmediatePropagationStopped()){
          break;
        }
      }

      if(originalEvent.isPropagationStopped()){
        break;
      }

      /** Go to parent level */
      $target = $target.parent();
    }
  };



  /*****************************
   *      INITIALIZATION
   ****************************/

  /**
   * Go through objects and suppress all selected events.
   */
  $.each([$(document), $(window), $('body'), $('html')], function(objectIndex, $object){
    $.each(['click', 'mousedown', 'mouseup'], function(eventIndex, eventType){
      blockEventFor($object, eventType);
    });
  });

  /**
   * MOCK CLICK EVENT
   */

  /**
   * Init Click-Mock for Dom $object
   * @param $object
   */
  var initClickMock = function($object) {
    var clickCancelationTimer, isClick;

    $object.on('touchstart', function(){
      isClick = true;
      clickCancelationTimer = setTimeout(function(){
        isClick = false;
      }, 300);
    });

    $object.on('touchmove', function(){
      isClick = false;
    });

    $object.on('touchend', function(event){
      clearTimeout(clickCancelationTimer);
      if(isClick){
       // console.log("CLICK MOCK", $object);
        executeMockedEventHandlers($object, 'click', event);
      }
    });
  };


  //initClickMock($(document));

  /**
   * Init Click-Mock for objects...
   */
  $.each([$(document), $(window), $('body'), $('html')], function(objectIndex, $object){
    initClickMock($object);
  });


  /**
   * MOCK MOUSEDOWN EVENT
   */

  /**
   * Init MouseDown-Mock for Dom $object
   * @param $object
   */
  var initMouseDownMock = function($object) {
    $object.on('touchstart', function (event) {
      //console.log("MOUSEDOWN MOCK", $object);
      executeMockedEventHandlers($object, 'mousedown', event);
    });
  };

  /**
   * Init MouseDown-Mock for objects...
   */
  $.each([$(document), $(window), $('body'), $('html')], function(objectIndex, $object){
    initMouseDownMock($object);
  });


  /**
   * MOCK MOUSEUP EVENT
   */

  /**
   * Init MouseUp-Mock for Dom $object
   * @param $object
   */
  var initMouseUpMock = function($object) {
    $object.on('touchend', function (event) {
      //console.log("MOUSEUP MOCK", $object);
      executeMockedEventHandlers($object, 'mouseup', event);
    });
  };

  /**
   * Init MouseUp-Mock for objects...
   */
  $.each([$(document), $(window), $('body'), $('html')], function(objectIndex, $object){
    initMouseUpMock($object);
  });

});

