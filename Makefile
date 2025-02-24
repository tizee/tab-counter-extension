.PHONY: clean

all: firefox

firefox:
	web-ext build --source-dir=./src -a=./dist --overwrite-dest

clean:
	rm -f ./output
