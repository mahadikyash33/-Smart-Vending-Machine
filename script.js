// ===============================
// SMART VENDING MACHINE
// MEALY MACHINE
// ===============================


// Products

let products = [
    {
        name: "Chips",
        price: 20,
        stock: 5
    },

    {
        name: "Biscuit",
        price: 10,
        stock: 5
    },

    {
        name: "Coke",
        price: 40,
        stock: 5
    },

    {
        name: "Juice",
        price: 50,
        stock: 5
    }
];


// Mealy Machine State

let state = "IDLE";

let selectedProduct = null;

let balance = 0;


// ===============================
// UPDATE STATE
// ===============================

function updateState(newState) {

    state = newState;

    document.getElementById("state").innerText =
        "State: " + state;

    document.getElementById("currentState").innerText =
        state;


    // Remove active state

    document.querySelectorAll(".state").forEach(function(element) {

        element.classList.remove("active");

    });


    // Activate current state

    let stateElement =
        document.getElementById(state.toLowerCase());

    if (stateElement) {

        stateElement.classList.add("active");

    }
}


// ===============================
// SHOW TRANSITION
// ===============================

function showTransition(from, input, output, next) {

    document.getElementById("fromState").innerText =
        from;

    document.getElementById("input").innerText =
        input;

    document.getElementById("output").innerText =
        output;

    document.getElementById("nextState").innerText =
        next;

    document.getElementById("message").innerText =
        output;

    document.getElementById("log").innerHTML =
        "Current State : " + from +
        "<br>Input : " + input +
        "<br>Output : " + output +
        "<br>Next State : " + next;
}


// ===============================
// SELECT PRODUCT
// ===============================

function selectProduct(index) {

    let from = state;

    let product = products[index];


    if (product.stock <= 0) {

        showTransition(
            from,
            "Select " + product.name,
            "Product unavailable",
            "IDLE"
        );

        updateState("IDLE");

        return;
    }


    selectedProduct = index;

    balance = 0;


    document.getElementById("selected").innerText =
        product.name;

    document.getElementById("price").innerText =
        product.price;

    document.getElementById("balance").innerText =
        balance;


    showTransition(
        from,
        "Select " + product.name,
        "Product selected",
        "PAYMENT"
    );

    updateState("PAYMENT");
}


// ===============================
// ADD COIN / NOTE
// ===============================

function addMoney(amount) {

    if (selectedProduct === null) {

        showTransition(
            state,
            "Money",
            "Please select a product first",
            "IDLE"
        );

        updateState("IDLE");

        return;
    }


    let from = state;


    balance += amount;


    document.getElementById("balance").innerText =
        balance;


    showTransition(
        from,
        "₹" + amount,
        "Payment accepted",
        "CHECK"
    );

    updateState("CHECK");


    // Automatically check payment

    setTimeout(function() {

        checkPayment();

    }, 500);
}


// ===============================
// DIGITAL PAYMENT
// ===============================

function digitalPayment(method) {

    if (selectedProduct === null) {

        showTransition(
            state,
            method,
            "Please select a product first",
            "IDLE"
        );

        updateState("IDLE");

        return;
    }


    let from = state;

    let product = products[selectedProduct];


    balance = product.price;


    document.getElementById("balance").innerText =
        balance;


    showTransition(
        from,
        method,
        method + " payment successful",
        "CHECK"
    );

    updateState("CHECK");


    setTimeout(function() {

        checkPayment();

    }, 500);
}


// ===============================
// CHECK PAYMENT
// ===============================

function checkPayment() {

    if (selectedProduct === null) {

        updateState("IDLE");

        return;
    }


    let product = products[selectedProduct];


    let from = state;


    // Check stock

    if (product.stock <= 0) {

        showTransition(
            from,
            "Check Stock",
            "Product unavailable",
            "IDLE"
        );

        updateState("IDLE");

        return;
    }


    // Check balance

    if (balance < product.price) {

        showTransition(
            from,
            "Check Payment",
            "Insufficient balance. Need ₹" +
            (product.price - balance) +
            " more",
            "PAYMENT"
        );

        updateState("PAYMENT");

        return;
    }


    // Payment successful

    showTransition(
        from,
        "Payment Verified",
        "Payment successful",
        "DISPENSE"
    );

    updateState("DISPENSE");


    setTimeout(function() {

        dispenseProduct();

    }, 1000);
}


// ===============================
// DISPENSE PRODUCT
// ===============================

function dispenseProduct() {

    let product = products[selectedProduct];


    let from = state;


    product.stock--;


    document.getElementById(
        "stock" + selectedProduct
    ).innerText = product.stock;


    showTransition(
        from,
        "Dispense",
        product.name + " dispensed successfully",
        "CHANGE"
    );

    updateState("CHANGE");


    setTimeout(function() {

        returnChange();

    }, 1000);
}


// ===============================
// RETURN CHANGE
// ===============================

function returnChange() {

    let product = products[selectedProduct];


    let change = balance - product.price;


    let from = state;


    let output;


    if (change > 0) {

        output =
            "Change returned: ₹" + change;

    }
    else {

        output =
            "No change required";

    }


    showTransition(
        from,
        "Transaction Complete",
        output,
        "IDLE"
    );


    updateState("IDLE");


    balance = 0;

    selectedProduct = null;


    document.getElementById("selected").innerText =
        "None";

    document.getElementById("price").innerText =
        "0";

    document.getElementById("balance").innerText =
        "0";
}


// ===============================
// CANCEL TRANSACTION
// ===============================

function cancelTransaction() {

    let from = state;


    let returned = balance;


    balance = 0;

    selectedProduct = null;


    document.getElementById("selected").innerText =
        "None";

    document.getElementById("price").innerText =
        "0";

    document.getElementById("balance").innerText =
        "0";


    showTransition(
        from,
        "Cancel",
        "Transaction cancelled. ₹" +
        returned +
        " returned",
        "IDLE"
    );


    updateState("IDLE");
}


// ===============================
// INITIAL STATE
// ===============================

updateState("IDLE");