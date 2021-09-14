build:
	docker build -t kotasko-server .
run: 
	docker run -v kotaskoFiles:/../userFiles -dp 5000:5000 --network kotasko --network-alias server --rm --name kotasko-server kotasko-server:latest
stop:
	docker stop kotasko-server
mongo:
	docker run --name mongodb -v mongo-data:/data/db --network kotasko --network-alias mongo -d mongo