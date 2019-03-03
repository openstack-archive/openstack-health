#!/usr/bin/env bash
# Updates the build and revision template to a new git reference

# - Service accounts, roles and secrets must exist in the target
# - kubectl is configured to point to the cluster where the pipeline is executed

# Optional (with defaults)
GIT_REFERENCE=${GIT_REFERENCE:-$(git rev-parse HEAD)}
GIT_URL=${GIT_URL:-https://github.com/afrittoli/openstack-health}
IMAGES_BASE_URL=${IMAGES_BASE_URL:-registry.ng.bluemix.net/andreaf}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD)}
USE_IMAGE_CACHE=${USE_IMAGE_CACHE:-"true"}
TARGET_NAMESPACE=${TARGET_NAMESPACE:-dev}
# Pipeline type is dev (build) or dev-test (build and run tests)
PIPELINE_TYPE=${PIPELINE_TYPE:-dev}
COMPONENTS=${COMPONENTS:-"api frontend"}

BASEDIR=$(ROOT=$(dirname $0); cd $ROOT; pwd)

# Variables
declare -A IMAGE_RESOURCES

echo "Buildin @$GIT_REFERENCE, IMAGE_TAG: $IMAGE_TAG"

## Setup resources
# GIT
GIT_RESOURCE=$(cat <<EOF | kubectl create -n dev -o jsonpath='{.metadata.name}' -f -
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  generateName: health-helm-git-knative-
  labels:
    app: health
    tag: "$IMAGE_TAG"
spec:
  type: git
  params:
    - name: revision
      value: $GIT_REFERENCE
    - name: url
      value: $GIT_URL
EOF
)

# Images
for COMPONENT in $COMPONENTS; do
  IMAGE_RESOURCES[$COMPONENT]=$(cat <<EOF | kubectl create -n dev -o jsonpath='{.metadata.name}' -f -
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  generateName: health-$COMPONENT-image-
  labels:
    app: health
    tag: "$IMAGE_TAG"
spec:
  type: image
  params:
    - name: url
      description: The target URL
      value: $IMAGES_BASE_URL/health-$COMPONENT
EOF
)
done

## Apply the service definition
for COMPONENT in $COMPONENTS; do
  sed -e 's/__GIT_RESOURCE_NAME__/'$GIT_RESOURCE'/g' \
      -e 's/__IMAGE_RESOURCE_NAME__/'${IMAGE_RESOURCES[$COMPONENT]}'/g' \
      -e 's/__TAG__/'$IMAGE_TAG'/g' ${BASEDIR}/${PIPELINE_TYPE}/${COMPONENT}.yaml | kubectl apply -f - -n dev
done

# Watch command
echo "watch kubectl get all -l tag=$IMAGE_TAG -n dev"
