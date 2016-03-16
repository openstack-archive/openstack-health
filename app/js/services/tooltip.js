'use strict';

var angular = require('angular');

var servicesModule = require('./_index.js');

function TooltipService() {
  var service = {};

  var render = function(dest, value, d) {
    if (angular.isFunction(value)) {
      value = value(d);
    }

    if (angular.isElement(value)) {
      dest.append(value);
    } else {
      dest.text(value);
    }

    return dest;
  };

  var fill = function(dest, element, count) {
    for (var i = 0; i < count; i++) {
      dest.append(element.clone());
    }
  };

  service.generator = function(content, options) {
    options = options || {};

    return function(d) {
      // partially render content first so we can determine the column count
      var columns = 0;
      var columnOffset = 0;
      var partialContent = [];

      var table = angular.element('<table>');
      table.addClass('osh-tooltip');
      if (options.addonClass) {
        table.addClass(options.addonClass);
      }

      angular.forEach(content, function(row) {
        // row can be a function to output colum values (or more functions)
        if (angular.isFunction(row)) {
          row = row(d);
        }

        var values = [];
        angular.forEach(row, function(col, i) {
          values.push(col);
          if (i + 1 > columns) {
            columns = i + 1;
          }
        });

        partialContent.push(values);
      });

      // build the header, if any
      if (options.title || options.header) {
        var thead = angular.element('<thead>');

        if (options.colors) {
          columnOffset++;
        }

        if (options.title) {
          var tr = angular.element('<tr>');

          var th = render(
              angular.element('<th>').attr('colspan', columns + columnOffset),
              options.title, d);
          tr.append(th);
          thead.append(tr);
        }

        if (options.header) {
          var tr = angular.element('<tr>');
          fill(tr, angular.element('<th>'), columnOffset);
          angular.forEach(options.header, function(title) {
            tr.append(render(angular.element('<th>'), title, d));
          });
          thead.append(tr);
        }

        table.append(thead);
      }

      // build the body
      var tbody = angular.element('<tbody>');
      angular.forEach(partialContent, function(row, rowIndex) {
        var tr = angular.element('<tr>');

        if (options.colors && options.colors[rowIndex]) {
          var td = angular.element('<td>');
          td.addClass('legend-color-guide');

          var div = angular.element('<div>');
          div.css('background-color', options.colors[rowIndex]);
          td.append(div);
          tr.append(td);

          fill(tr, angular.element('<td>'), columnOffset - 1);
        } else {
          fill(tr, angular.element('<td>'), columnOffset);
        }

        angular.forEach(row, function(col, i) {
          var td = render(angular.element('<td>'), col, d);
          if (row.length < columns && i == row.length - 1) {
            // auto-set colspan for last entry in row
            td.attr('colspan', columns - i);
          }

          tr.append(td);
        });

        tbody.append(tr);
      });
      table.append(tbody);

      return table[0].outerHTML;
    };
  };

  return service;
}

servicesModule.service('tooltipService', TooltipService);
