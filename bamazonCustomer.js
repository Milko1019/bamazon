var mysql = require('mysql');
var inquirer = require('inquirer');
var columnify = require('columnify');

var connection = mysql.createConnection({
    host: "localhost",
    // Your port; if not 3306
    port: 8889,
    // Your username
    user: "root",
    // Your password
    password: "root",
    database: "bamazon_db"
});

function showProducts() {
    var product_catalog = [];
    var product_catalog_names = [];
   
    connection.query('SELECT * FROM products WHERE stock_quantity != 0', function (error, results) {
        if (error) throw error;
        console.log(`------------------------------------------------------------------------------------`);
        console.log(columnify(results, {
            columns: ['id', 'product_name', 'department_name', 'price', 'stock_quantity']
        }))
        console.log(`------------------------------------------------------------------------------------`);
        var newResults = JSON.parse(JSON.stringify(results));
        newResults.forEach((element) => {
            product_catalog_names.push(element.product_name);
        }, this);
        newResults.forEach((element) => {
            product_catalog.push(element);
        }, this);

        purchase(product_catalog, product_catalog_names);
    });
}

function purchase(product_catalog, product_catalog_names) {
    console.log("");
    inquirer.prompt([{
            name: "purchase_id",
            message: "Which product would you like to purchase?",
            type: "list",
            choices: product_catalog_names,

        },
        {
            name: "purchase_amount",
            message: "How many units would you like to purchase?",
            type: "input",
            validate: (value) => {
                var valid = !isNaN(parseFloat(value));
                return valid || 'Please enter a number'
            }
        }
    ]).then(function (answers) {
        var chosen_id = product_catalog_names.indexOf(answers.purchase_id) + 1;

        var chosen_product = product_catalog[chosen_id - 1];

        if (chosen_product.stock_quantity < answers.purchase_amount) {
            var current_quantity = chosen_product.stock_quantity;
            console.log(`\n - - - - -  - - - - - - - - - - - - - - - - - - \n`);
            console.log("Insufficient quantity! There are only " + `${current_quantity}` + " left");
            console.log(`\n - - - - -  - - - - - - - - - - - - - - - - - - \n`);

            purchase(product_catalog, product_catalog_names);
        } else {
            var current_quantity = chosen_product.stock_quantity - answers.purchase_amount;
            var totalSale = Math.round(answers.purchase_amount * chosen_product.price).toFixed(3);
            var increaseSales = Math.round(chosen_product.product_sales).toFixed(3) + totalSale;
        
            connection.query(`UPDATE products SET stock_quantity=${current_quantity}, product_sales=${increaseSales} WHERE id = ${chosen_id}`, function (error, results) {
                console.log(`\n - - - - -  - - - - - - - - - - - - - - - - - - \n`);
                console.log(`Items Purchased:\n`);
                console.log(`${chosen_product.product_name} = ${chosen_product.price} x ${answers.purchase_amount}`);
                console.log(`Your total will be: $${chosen_product.price * answers.purchase_amount}\n`);
                console.log(`\n - - - - -  - - - - - - - - - - - - - - - - - - \n`);

                showProducts();
            })
        }
    });
}

showProducts();


