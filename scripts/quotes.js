"use strict";

window.momentum = window.momentum || {};

// Quotes

momentum.QuoteCtrl = function() {
  this.apiUrl = "https://emilyxietty.github.io/swift.html";
};

momentum.QuoteCtrl.prototype = {
  fetchQuote: function(cb) {
    $.ajax({
      url: this.apiUrl,
      method: "GET",
      success: cb
    });
  }
};
