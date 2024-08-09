import random

def gen_random_filename():
    image_filename = ''.join([chr(random.choice([random.randint(ord('a'), ord('z')),
                                                 random.randint(ord('A'), ord('Z')),
                                                 random.randint(ord('0'), ord('9'))])) for _ in range(5)])
    return image_filename
