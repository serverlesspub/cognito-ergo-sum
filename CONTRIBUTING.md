Contributor guide

# Prerequisites 

- AWS command line tools
- cfn-lint
- node 20 or later
- gnu make


# Running tests

> [!TIP]
> If you do not have a default AWS profile, make sure to provide it using the `AWS_PROFILE=something <COMMAND>` prefix.

## Creating the test stack for integration tests

To create the test cfn stack, run:

```
make up
``` 

You can optionally specify a different test stack name and AWS region

```
make up AWS_REGION=us-west-1 STACK_NAME=MyTestStack
```

To create the .env file required by tests, run:

```
make .env
```

## Install dependencies

Run the npm install command:

```
npm i
```

## Run JEST

Run:

```
NODE_OPTIONS="--experimental-vm-modules" npm t
```
