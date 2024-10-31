# File Processor

## Description

This project is a file processing system that allows users to upload files, process them, and receive processing results.

## Running the System Locally

To run the system locally, please follow these steps:

1. Clone the Project from Git

   git clone <repository-url>
   cd <project-directory>

2. Install Dependencies

   npm install

3. Create a Development Environment File

Create a file named `.env.development` and copy the values from `.env.example` into it.

4. Start Redis and MongoDB

Use Docker to run Redis and MongoDB with the following command:

    docker-compose -f docker-compose-dev.yml up --build -d

5. Run the Project

Start the project using:

    npm run dev

6. Run Tests

To execute the tests, use:

    npm run test

License

This project is licensed under the MIT License.
