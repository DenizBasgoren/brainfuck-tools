
// settings:
const memoryLength = 30000
const memoryOverflow = 'wrap' // wrap, saturate, error
const intOverflow = 'wrap' // wrap, saturate, error

// wrap means the next after maximum is minimum.
// saturate means the next after maximum is maximum.

let fs = require('fs')
let process = require('process')

if (process.argv.length < 3) {
    console.error('Usage: node interpreter.js yourProgram.bf')
    process.exit(1)
}

let program
try {
    program = fs.readFileSync(process.argv[2], {encoding:'utf8'})
}
catch(err) {
    console.error('Error: cannot read the file.')
    process.exit(2)
}

let bracketCount = 0
for (let i = 0; i<program.length; i++) {
    if (program[i] == '[') bracketCount++
    else if (program[i] == ']') bracketCount--
    if (bracketCount < 0) {
        console.error('Error: Unmatched ] character encountered.')
        process.exit(3)
    }
}
if (bracketCount > 0) {
    console.error('Error: Unmatched [ character encountered.')
    process.exit(4)
}

let memory = Array(memoryLength).fill(0)
let programIndex = 0
let memoryIndex = 0

while (programIndex>=0 && programIndex<program.length) {
    let currentInstruction = program[programIndex]
    if (currentInstruction=='>') {
        memoryIndex++
        if (memoryIndex==memoryLength) {
            if (memoryOverflow=='wrap') memoryIndex=0
            else if (memoryOverflow=='saturate') memoryIndex=memoryLength-1
            else {
                console.error('Error: Memory overflow')
                process.exit(5)
            }
        }
        programIndex++
    }
    else if (currentInstruction=='<') {
        memoryIndex--
        if (memoryIndex==-1) {
            if (memoryOverflow=='wrap') memoryIndex=memoryLength-1
            else if (memoryOverflow=='saturate') memoryIndex=0
            else {
                console.error('Error: Memory underflow')
                process.exit(6)
            }
        }
        programIndex++
    }
    else if (currentInstruction=='+') {
        memory[memoryIndex]++
        if (memory[memoryIndex]==256) {
            if (intOverflow=='wrap') memory[memoryIndex]=0
            else if (intOverflow=='saturate') memory[memoryIndex]=255
            else {
                console.error('Error: Integer overflow')
                process.exit(7)
            }
        }
        programIndex++
    }
    else if (currentInstruction=='-') {
        memory[memoryIndex]--
        if (memory[memoryIndex]==-1) {
            if (intOverflow=='wrap') memory[memoryIndex]=255
            else if (intOverflow=='saturate') memory[memoryIndex]=0
            else {
                console.error('Error: Integer underflow')
                process.exit(8)
            }
        }
        programIndex++
    }
    else if (currentInstruction==',') {
        process.stdout.write('Input character: ')
        let buffer = Buffer.alloc(1)
        let bytesRead = fs.readSync(0, buffer, 0, 1)
        if (bytesRead==1) {
            memory[memoryIndex]=buffer[0]
        }
        else {
            memory[memoryIndex]=0
        }
        programIndex++
    }
    else if (currentInstruction=='.') {
        process.stdout.write(String.fromCharCode(memory[memoryIndex]))
        programIndex++
    }
    else if (currentInstruction=='[') {
        if (memory[memoryIndex]==0) { // skip forward to matching ]
            let bracketCount = 1
            while (true) {
                programIndex++
                if (program[programIndex]=='[') bracketCount++
                else if (program[programIndex]==']') bracketCount--
                if (bracketCount==0) break
            }
        }
        else {
            programIndex++
        }
    }
    else if (currentInstruction==']') {
        if (memory[memoryIndex]!=0) { // skip backward to matching [
            let bracketCount = 1
            while (true) {
                programIndex--
                if (program[programIndex]==']') bracketCount++
                else if (program[programIndex]=='[') bracketCount--
                if (bracketCount==0) break
            }
        }
        else {
            programIndex++
        }
    }
    else {
        // ignore all other characters
        programIndex++
    }
}
