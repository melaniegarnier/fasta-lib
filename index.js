/*
current usage :
fastaLib = require('fasta-lib'); // after installing fasta-lib package
fastaLib.fastaToDuplex('/PATH/OF/FASTA/FILE').on('end', callback());
*/

/*
for tests :
in the current folder, use the command :
node index.js -f ./test/1z00.fasta
*/

// Helpful :
// https://books.google.fr/books?id=pSoTBQAAQBAJ&pg=PA92&lpg=PA92&dq=javascript+cr%C3%A9er+un+objet+stream+en+%C3%A9criture+module+fs&source=bl&ots=sNJw10BpD9&sig=Uu1a4o08vxinBCNhJqTooeJaxqM&hl=fr&sa=X&ved=0ahUKEwj4l6G43NDQAhVENhoKHdLmBf8Q6AEIIzAB#v=onepage&q=javascript%20cr%C3%A9er%20un%20objet%20stream%20en%20%C3%A9criture%20module%20fs&f=false

// TODO
// - doc
// - check if it's possible to read more than one time the duplex


var events = require('events');
var byline = require('byline');
var fs = require('fs');
var stream = require('stream');

var fastaObj = require('./lib/fastaObj.js');

var regex_head = /^(>)/; // regex for the header line in a fasta file
var regex_seq = /^([A-Ya-y]{1,})$/; // regex for the sequence lines in a fasta file


var parseBuffer = function () {
    // definition of the line names for each section
    return {
        header: {regex: regex_head, data: []},
        sequence: {regex: regex_seq, data: []}
    };
}

var setBuffer = function (line, nBuffer) {
	if (! line) throw 'No line to read specified';
	if (! nBuffer) throw 'No buffer specified';

	for (var i in nBuffer) {
		if(line.match(nBuffer[i].regex)) return nBuffer[i].data;
	}
	return null;
}

// parse the fasta file & create fasta objects
var parse = function (data) {
	if (! data) throw 'Error : no input specified';

	var emitter = new events.EventEmitter();
	var stream;

	if ('file' in data) stream = byline(fs.createReadStream(data.file, {encoding: 'utf8'}));
	else if ('rStream' in data) stream = byline(data.rStream);
	else throw 'Error : no input specified';

	var bufferArray = new Array();
	var numBuff = -1;
	// for each line
	stream.on('readable', function () {
		while((line = stream.read()) !== null) {
			if (typeof(line) !== 'string') line = line.toString();

			// if new fasta
			if (line.match(regex_head)) {
				var nBuffer = parseBuffer();
				bufferArray.push(nBuffer);
				numBuff++;
			}

			var refBuff = setBuffer(line, bufferArray[numBuff]);
			if (! refBuff) continue;
			refBuff.push(line);
		}
	})
	.on('end', function () {
		fastaArray = new Array();
		bufferArray.forEach(function (nBuffer, i, array) {
			var fasta = new fastaObj.FastaObj();
			fasta.setAttributes(nBuffer);
			fastaArray.push(fasta);
		});
		emitter.emit('end', fastaArray);
	});
	return emitter;
}

// create a duplex stream
var createDuplex = function () {
	var dup = new stream.Duplex(); // stream both readable and writable

	// necessary to use stream.write()
	dup._write = function (chunk, encoding, callback) {
		if (chunk.toString().indexOf('a') >= 0) {
	      	console.log('chunk is invalid');
	    } else {
	    	console.log('chunk is valid');
	      	callback();
	    }
	    this.push(chunk); // true
	}
	// necessary to use stream.read()
	dup._read = function (size) {
		console.log('Reading the stream : ');
	}
	return dup;
}

// write every fasta into a unique duplex stream
var stringToDuplex = function (fastaArray) {
	if (! fastaArray) throw 'No array of fasta objects specified';
	var emitter = new events.EventEmitter();
	var dup = createDuplex();

	fastaArray.forEach(function (fasta, i, array) {
		//console.log(fasta.toString());
		dup.write(fasta.toString(), function () {
			emitter.emit('readable', dup);
		});
	});// is synchronicity a problem for the following emitter ?
	return emitter;
}

var duplexToString = function (dup) {
	if (! dup) throw 'No duplex specified';
	var emitter = new events.EventEmitter();

	str = dup.read();
	if (str !== null) if(typeof(str) !== 'string' ) str = str.toString();
	console.log('str :' + str);
	emitter.emit('end', dup);
	return emitter;
}

// give orders
var fastaToDuplex = function (fastaFile) {
	if (! fastaFile) throw 'No fasta file specified';

	var emitter = new events.EventEmitter();
	parse({'file' : fastaFile}).on('end', function (fastaArray) {
		stringToDuplex(fastaArray).on('readable', function (dup) { // beginning of the writing
			// check the writing on the duplex & the possibility to read it
			duplexToString(dup).on('end', function (dup) {
				emitter.emit('end');
			});
		});
	});
	return emitter;
}


module.exports = {
	fastaToDuplex : fastaToDuplex
}


// for tests
process.argv.forEach(function (val, index, array) {
	//console.log(index + '>>>' + val + '>>>' + array);
	var fastaFile = null;
	if (val === '-f') {
		if (! array[index + 1]) throw 'Usage : node index.js -f [PATH_TO_FASTA_FILE]';
		fastaFile = array[index + 1];
		fastaToDuplex(fastaFile)
		.on('end', function (dup) {
			console.log('The fasta file has been parsed and transformed into a duplex stream.\nEnd of process :');
			console.log(dup);
		});
	}
});


