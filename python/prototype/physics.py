# Robert A Fraser's Patent-Pending Scuffed Physics Library
import math


class Vector(object):
    def __init__(self, x=0, y=0):
        self.x, self.y = x, y

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        elif isinstance(other, tuple):
            return Vector(self.x + other[0], self.y + other[0])

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, other):
        if isinstance(other, Vector):
            return self.dot(other)
        elif isinstance(other, (int, float)):
            return Vector(self.x * other, self.y * other)

    def __rmul__(self, other):
        return self.__mul__(other)

    def __repr__(self):
        return f"({self.x}, {self.y})"

    def dot(self, other):
        return (self.x * other.x) + (self.y * other.y)

    def magnitude(self):
        return math.hypot(self.x, self.y)

    def normalize(self):
        norm = self.magnitude()
        if norm == 0:
            return Vector(0, 0)
        else:
            return Vector(self.x / norm, self.y / norm)


class PhysicsObject:
    def __init__(self, x, y, static):
        self.position = Vector(x, y)
        self.velocity = Vector(0, 0)
        self.static = static

    def physics_step(self, delta=1, acceleration=Vector(0, 0)):
        if self.static:
            return

        self.position = self.position + delta * self.velocity
        self.velocity = self.velocity + delta * acceleration


class Circle(PhysicsObject):
    color = "#718093"
    outline = None

    def __init__(self, x, y, r, static):
        self.radius = r
        super().__init__(x, y, static)

    def draw(self, draw):
        x, y = self.position.x, self.position.y
        r = self.radius
        draw.ellipse((x - r, y - r, x + r, y + r), fill=self.color, outline=self.outline)


class Block(PhysicsObject):
    color = "#718093"

    def __init__(self, x1, y1, x2, y2):
        self.corner = Vector(x2, y2)
        super().__init__(x1, y1, True)

    def draw(self, draw):
        x1, y1 = self.position.x, self.position.y
        x2, y2 = self.corner.x, self.corner.y
        draw.rectangle((x1, y1, x2, y2), fill=self.color)


class Peg(Circle):
    color = "#718093"

    def __init__(self, x, y, size=16):
        super().__init__(x, y, size, True)


class Ball(Circle):
    color = "#ff4757"
    outline = "#f1f2f6"

    def __init__(self, x, y, size=16, edge=512):
        self.edge = edge
        super().__init__(x, y, size, False)

    def collision_check(self, other):
        if isinstance(other, Circle):
            distance = (self.position - other.position).magnitude()
            if distance <= self.radius + other.radius:
                normal = (self.position - other.position).normalize()

                if other.static:
                    # Simple collisions
                    self.velocity = self.velocity - 1.8 * normal.dot(self.velocity) * normal
                    self.position += normal
                else:
                    # Elastic collisions (assuming same mass)
                    p1, p2 = self.position, other.position
                    v1, v2 = self.velocity, other.velocity

                    u1 = v1 - (v1 - v2).dot(p1 - p2) / distance * (p1 - p2).normalize()
                    u2 = v2 - (v2 - v1).dot(p2 - p1) / distance * (p2 - p1).normalize()

                    other.velocity = u2
                    self.velocity = u1
                    self.position += normal
        elif isinstance(other, Block):
            x1, y1, x2, y2 = (
                other.position.x,
                other.position.y,
                other.corner.x,
                other.corner.y,
            )
            cx, cy = self.position.x, self.position.y
            testX, testY = cx, cy

            # Determine which edge to check
            if cx < x1:
                testX = x1
            elif cx > x2:
                testX = x2
            if cy < y1:
                testY = y1
            elif cy > y2:
                testY = y2

            # Distance check
            collide = self.position - Vector(testX, testY)
            distance = collide.magnitude()
            if distance <= self.radius:
                # Collision!
                normal = collide.normalize()
                self.velocity = self.velocity - 1.8 * normal.dot(self.velocity) * normal
                self.position += normal


class Scene(object):
    def __init__(self, objects, gravity=Vector(0, 0)):
        # Split into active & static objects
        # This greatly simplifies our calculations later on (static objects don't move etc.)
        self.gravity = gravity
        self.static_objects = []
        self.active_objects = []
        for obj in objects:
            if obj.static:
                self.static_objects.append(obj)
            else:
                self.active_objects.append(obj)

    def step(self, delta=1):
        for obj in self.active_objects:
            obj.physics_step(delta=delta, acceleration=self.gravity)

        self.collision_check()

    def collision_check(self):
        for i, obj in enumerate(self.active_objects):
            # Check static collisions
            for static in self.static_objects:
                obj.collision_check(static)

            # Check with all future active objects
            # If we check object 1->2, don't check 2->1 etc.
            for active in self.active_objects[i + 1 :]:
                obj.collision_check(active)

    def draw(self, draw):
        for obj in self.active_objects:
            obj.draw(draw)

        for obj in self.static_objects:
            obj.draw(draw)
