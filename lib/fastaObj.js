/*
Define the fasta object
And a method to set its attributes
*/

// TODO
// - add to toString function the writing of the sequence each 80 characters
// - doc



var FastaObj = function (opt) {
	var nArgs = opt ? opt : {};
	// constructor
	this.header = null;
	this.sequence = '';
}


FastaObj.prototype.setAttributes = function (opt) {
	var nArgs = opt ? opt : {};
	var self = this;

	// set the values of the FastaObj attributes, according to nArgs
	if ('header' in nArgs && nArgs.header.data.length > 0) {
		this.header = nArgs.header.data[0];
	}
	if ('sequence' in nArgs && nArgs.sequence.data.length > 0) {
		nArgs.sequence.data.forEach(function (li, i, array) {
			self.sequence += li;
		});
	}
}


FastaObj.prototype.toString = function (opt) {
	var nArgs = opt ? opt : {};
	var str = '';

	if (this.header !== null) str += this.header + '\n';
	else return null;
	if (this.sequence.length > 0) str += this.sequence + '\n';
	else return null;

	return str;
}


module.exports = {
	FastaObj : FastaObj,
}