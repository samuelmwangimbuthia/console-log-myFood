#! /usr/bin/env node

const { default: axios } = require('axios');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'enter command >'
})

readline.prompt();
readline.on('line', line =>{
  switch (line.trim()){
    case 'log' : 
    {
      readline.question(`what would you like to log today?`,async (item) => {
        const { data } = await axios.get('http://localhost:3001/food');
        const it = data[Symbol.iterator]();
        let position = it.next();
        while (!position.done){
          const food = position.value.name;
          if (food === item){
            console.log(`${item} has ${position.value.calories} calories`);
          }
          position = it.next();
        }
         readline.prompt();
       });

    }
  }
})
