Development:

- node server.js
- pmn start




Commands:
git clone https://github.com/chookapp/kubview.git kubview
aws ecr create-repository --repository-name gil_kubview --region eu-central-1
`aws ecr get-login --no-include-email`
cd kubview
docker build -t kubview .
docker tag kubview <the URL we got>
docker push <the URL we got>

kubectl create -f serviceAccount.yaml
kubectl create -f role.yaml
kubectl create -f binding.yaml

kubectl create -f deployment.yaml
kubectl create -f service.yaml

kubectl delete deployment kubview-dep
kubectl delete service kubview

aws ecr batch-delete-image --repository-name gil_kubview --image-ids imageTag=latest
aws ecr delete-repository --repository-name gil_kubview --region eu-central-1
