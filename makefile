AWS_REGION := us-east-1
STACK_NAME := CognitoErgoSumTest
ENV_FILE := .env

up: tests/test-stack.yml
	cfn-lint $< 
	aws cloudformation deploy --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
	--template-file $< \
	--stack-name $(STACK_NAME) --region $(AWS_REGION)

down:
	aws cloudformation delete-stack \
	--stack-name $(STACK_NAME) --region $(AWS_REGION)

.env: tests/test-stack.yml
	aws cloudformation describe-stacks  \
	--query 'Stacks[].Outputs[].[OutputKey,OutputValue]' \
    --stack-name $(STACK_NAME) --region $(AWS_REGION) \
	--output text | tr '\t' '=' > $@

.PHONY: up down 
