pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "your-docker-registry" // e.g. DockerHub or AWS ECR
        APP_NAME = "lexai"
        GIT_TAG = sh(script: 'git describe --tags --always', returnStdout: true).trim()
        DEPLOY_PATH = "/var/www/lexai"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Setup') {
            steps {
                withCredentials([file(credentialsId: 'lexai-env-prod', variable: 'PROD_ENV')]) {
                    sh 'cp $PROD_ENV .env.production'
                    sh 'cp $PROD_ENV legal-ai-backend/.env'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('my-new-portal-app') {
                    sh 'docker build -t ${APP_NAME}-frontend:${GIT_TAG} .'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('legal-ai-backend') {
                    sh 'docker build -t ${APP_NAME}-backend:${GIT_TAG} .'
                }
            }
        }

        stage('Build Nginx') {
            steps {
                dir('nginx') {
                    sh 'docker build -t ${APP_NAME}-nginx:${GIT_TAG} .'
                }
            }
        }

        stage('Deploy Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to Staging Server...'
                // Add staging deployment commands here
            }
        }

        stage('Deploy Production') {
            when {
                branch 'master'
                buildingTag()
            }
            steps {
                echo "Deploying version ${GIT_TAG} to Production..."
                sh '''
                    docker compose -p ${APP_NAME}-prod down --remove-orphans
                    docker compose -p ${APP_NAME}-prod up -d --build
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed! Initiating rollback analysis...'
        }
    }
}
