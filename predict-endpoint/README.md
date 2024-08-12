docker build -t ac-py-predict .


docker run -p 5000:5000 ac-py-predict



aws ecr create-repository --repository-name ac-py-predict --region us-east-1
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 288364637477.dkr.ecr.us-east-1.amazonaws.com
docker tag ac-py-predict:latest 288364637477.dkr.ecr.us-east-1.amazonaws.com/ac-py-predict:latest
docker push 288364637477.dkr.ecr.us-east-1.amazonaws.com/ac-py-predict:latest

aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/y3q1s2x2
docker tag ac-py-predict:latest public.ecr.aws/y3q1s2x2/ac-py-predict:latest
docker push public.ecr.aws/y3q1s2x2/ac-py-predict:latest