#! /usr/bin/env node
const axios = require("axios");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "enter command >",
});
readline.prompt();
readline.on("line", async (line) => {
  switch (line.trim()) {
    case "list vegan foods":
      {
        //using a generator in place of custom iterator
       const {data} = await axios.get("http://localhost:3000/food");
       function *listVeganFoods(){
        let idx = 0;
        const veganOnly = data.filter((food) =>
          food.dietary_preferences.includes("vegan")
        );
        //pass a food out the iterator using the yield keyword
        while(veganOnly[idx]) {
          yield veganOnly[idx];
          idx++;
        }
       }
     
          /*
          const veganIterable = {
            [Symbol.iterator]() {
              return {
                [Symbol.iterator]() {
                  return this;
                },
                next() {
                  // const current = data[idx]; //using data array
                  const current = veganOnly[idx];
                  idx++;
                  if (current) {
                    return { value: current, done: false };
                  } else {
                    return { value: current, done: true };
                  }
                },
              };
            },
          };
          */
          for (let val of listVeganFoods()) {
            console.log(val.name);
          }
          readline.prompt();
      }
      break;
    case "log":
      const { data } = await axios.get("http://localhost:3000/food");
      const it = data[Symbol.iterator]();
      let actionIt;

      // yield between the functionalities
      // custom return and throw methods already defined in generator functions
      function *actionGenerator(){
        //food entered by the user is passed to the generator first
        const food = yield;
        //prompt the user to enter the serving size
        const servingSize = yield askForServingSize();
        yield displayCalories(servingSize,food);
      }
      /*
        //cycle through the actions array
      const actionIterator = {
        [Symbol.iterator]() {
          let positions = [...this.actions];
          return {
            [Symbol.iterator]() {
              return this;
            },
            next(...args) {
              if (positions.length > 0) {
                const position = positions.shift();
                const result = position(...args);
                return { value: result, done: false };
              } else {
                return { done: true };
              }
            },

            return() {
              positions = [];
              return { done: true };
            },

            throw(error) {
              console.log(error);
              return { value: undefined, done: true };
            },
          };
        },
        actions: [askForServingSize, displayCalories],
      };
    */
      function askForServingSize() {
        readline.question(
          `How many servings did you eat? (as a decimal: 1, 0.5, 1.244, etc..)`,
          (servingSize) => {
            if (servingSize === "neverMind" || servingSize === "n") {
              actionIt.return();
            } else {
              actionIt.next(servingSize);
            }
          }
        );
      }

    async function displayCalories(servingSize, food) {
        const calories = food.calories;
        console.log(
          `${food.name} 
            with a serving size of ${servingSize} has a
           ${Number.parseFloat(
             calories * parseInt(servingSize, 10)
           ).toFixed()} calories.`
        );

        const {data} = await axios.get('http://localhost:3000/users/1');
        const usersLog = data.log || [];
        const putBody = {
          ...data,
          log: [...usersLog,
          {
            food: food.name,
            servingSize,
            calories: Number.parseFloat(
              calories*parseInt(servingSize, 10),
            )

          }
        ]
        }

        await axios.put('http://localhost:3000/users/1', putBody,{
          headers: {
            'Content-Type': 'application/json'
          }
        })
        actionIt.next();
        readline.prompt();
      }
      readline.question(`what would you like to log today?`, (item) => {
        let position = it.next();
        while (!position.done) {
          const food = position.value.name;
          if (food === item) {
            console.log(`${item} has ${position.value.calories} calories`);
            //actionIt = actionIterator[Symbol.iterator]();
            actionIt = actionGenerator();
            actionIt.next();
            actionIt.next(position.value);
          }
          position = it.next();
        }
        readline.prompt();
      });
      break;
      case `today's log`:
        readline.question('Email:', async emailAddress =>{
          const {data} = await axios.get(
            `http://localhost:3000/users?email=${emailAddress}`,
          );
          const foodLog = data[0].log || [];
          let totalCalories = 0;

          function *getFoodLog(){
            yield *foodLog;
          }

          for(const entry of getFoodLog()){
            const timestamp = Object.keys(entry)[0];
            if(isToday(new Date(Number(timestamp)))){
              console.log(
                `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`,
              );
              totalCalories += entry[timestamp].calories;
            }
          }
          console.log('------');
          console.log(`Total Calories: ${totalCalories}`);
          readline.prompt();
        });
        break;
  }

  readline.prompt();
});

function isToday(timestamp){
  const today = new Date();
  return (
    timestamp.getDate() === today.getDate() && 
    timestamp.getMonth() === today.getMonth() &&
    timestamp.getFullYear() === today.getFullYear()
  );
}
