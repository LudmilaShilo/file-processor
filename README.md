# File Processor

## Description

This project is a file processing system that allows users to upload files, process them, and receive processing results.

## Running the System Locally

To run the system locally, please follow these steps:

1. Clone the Project from Git and cd into

   git clone https://github.com/LudmilaShilo/file-processor

   cd file-processor

2. Install the Dependencies assume a node ecosystem already install

   npm install

3. Create the Development Environment File

   cp .env.example .env.development

4. Start Redis and MongoDB

Use Docker to run Redis and MongoDB with the following command:

    docker-compose -f docker-compose-dev.yml up --build -d

5. Run the Project

Start the project using:

    npm run dev

6. Run Tests

To execute the tests, use:

    npm run test

7. Please find the usage documentation on this link:

<https://www.postman.com/planetary-crescent-498171/workspace/file-processing-project/collection/6557541-9e307539-f742-4403-8941-60bc56abd4b3?action=share&creator=6557541>

License

This project is licensed under the MIT License.
