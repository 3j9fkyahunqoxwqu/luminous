injections_controller(function() {
  var inject_options_for_domain = function(options, from) {
    var json_options_element = document.getElementById('luminous-options');

    if(!json_options_element) {
      var json_options_injection = document.createElement('script');
      json_options_injection.type = 'application/json';
      json_options_injection.id = 'luminous-options';
      json_options_injection.innerHTML = JSON.stringify(options);
      json_options_injection.setAttribute('data-changed', 'true');
      if(from) {
        json_options_injection.setAttribute('data-from', from);
      }
      document.documentElement.insertBefore(json_options_injection, document.documentElement.firstChild);
    } else {
      json_options_element.innerHTML = JSON.stringify(options);
      json_options_element.setAttribute('data-changed', 'true');
    }
  }

  var collect_details = (Cookies.get('ld') == 't') ? true : false;

  if(Cookies.get('ls')) {
    inject_options_for_domain({
      disabled: uncompress_settings(Cookies.get('ls')),
      collect_details: collect_details
    }, 'cookies');
  }

  var load_options_for_domain = function(domain) {
    chrome.storage.sync.get(null, function(sync_data) {
      sync_data  = apply_settings_for_domain(sync_data);

      var options = {}

      options['disabled'] = sync_data['disabled_' + domain];
      options['injection_disabled'] = (
        sync_data['injection_disabled']['general'] || sync_data['injection_disabled'][domain]
      );

      options['collect_details'] = sync_data['popup']['show_code_details'];

      inject_options_for_domain(options);
    });
  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(namespace == 'sync') {
      var domain = window.location.hostname;

      if(changes) {
        changes = changes;

        var disabled_for_domain = false;

        if(changes['disabled_' + domain] && changes['disabled_' + domain].newValue) {
          if(changes['disabled_' + domain].oldValue) {
            disabled_for_domain = changes['disabled_' + domain].newValue != changes['disabled_' + domain].oldValue;
          } else {
            disabled_for_domain = true;
          }
        }

        if(changes) {
          var default_keys = [];

          for(possible_kind in changes) {
            var regex = /^default_disabled_/;
            if(regex.test(possible_kind)) {
              default_keys.push(possible_kind.replace(regex, ''));
            }
          }

          if(default_keys.length > 0) {
            disabled_for_domain = true;
          }
        }

        var injection_disabled_for_domain = false;
        var injection_disabled_for_general = false;

        if(changes['injection_disabled'] && changes['injection_disabled'].newValue) {
          if(changes['injection_disabled'] && changes['injection_disabled'].oldValue) {
            injection_disabled_for_domain = changes['injection_disabled'].newValue[domain] != changes['injection_disabled'].oldValue[domain];
            injection_disabled_for_general = changes['injection_disabled'].newValue['general'] != changes['injection_disabled'].oldValue['general'];
          } else {
            injection_disabled_for_domain = true;
            injection_disabled_for_general = true;
          }
        }

        if(disabled_for_domain || injection_disabled_for_domain || injection_disabled_for_general) {
          load_options_for_domain(domain);
        }
      }
    }
  });

  load_options_for_domain(window.location.hostname);
});
