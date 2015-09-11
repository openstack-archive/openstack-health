var binaryMinIndex = function(min, array, func) {
  "use strict";

  var left = 0;
  var right = array.length - 1;

  while (left < right) {
    var mid = Math.floor((left + right) / 2);

    if (min < func(array[mid])) {
      right = mid - 1;
    } else if (min > func(array[mid])) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  if (left >= array.length) {
    return array.length - 1;
  } else if (func(array[left]) <= min) {
    return left;
  } else {
    return left - 1;
  }
};

var binaryMaxIndex = function(max, array, func) {
  "use strict";

  var left = 0;
  var right = array.length - 1;

  while (left < right) {
    var mid = Math.floor((left + right) / 2);

    if (max < func(array[mid])) {
      right = mid - 1;
    } else if (max > func(array[mid])) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  if (right < 0) {
    return 0;
  } else if (func(array[right]) <= max) {
    return right + 1; // exclusive index
  } else {
    return right;
  }
};

module.exports = {
  binaryMinIndex: binaryMinIndex,
  binaryMaxIndex: binaryMaxIndex
};
